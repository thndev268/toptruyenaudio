import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class KnowledgeDocumentService {
  private readonly logger = new Logger(KnowledgeDocumentService.name);
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_MIME_TYPES = [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
  ];
  private readonly CHUNK_SIZE = 1000; // Characters per chunk
  private readonly CHUNK_OVERLAP = 200; // Overlap between chunks

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async getDocuments() {
    return this.prisma.botKnowledgeDocument.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });
  }

  async getDocumentById(id: string) {
    return this.prisma.botKnowledgeDocument.findUnique({
      where: { id },
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });
  }

  async uploadDocument(
    file: Express.Multer.File,
    uploadedBy?: string,
  ) {
    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    // Validate MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    this.logger.log(
      `[KnowledgeDocument] Uploading file: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`,
    );

    try {
      // Disable/delete old documents if replacing
      const existingDocs = await this.prisma.botKnowledgeDocument.findMany({
        where: { status: 'READY' },
      });

      if (existingDocs.length > 0) {
        this.logger.log(`[KnowledgeDocument] Disabling ${existingDocs.length} existing documents`);
        await this.prisma.botKnowledgeDocument.updateMany({
          where: { status: 'READY' },
          data: { status: 'DISABLED' },
        });
      }

      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${file.originalname}`;
      const storagePath = `knowledge/${fileName}`;
      
      const publicUrl = await this.storageService.uploadFile(
        'media',
        storagePath,
        file.buffer,
        file.mimetype,
      );

      this.logger.log(`[KnowledgeDocument] File uploaded to: ${publicUrl}`);

      // Create document record
      const document = await this.prisma.botKnowledgeDocument.create({
        data: {
          fileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          storagePath,
          status: 'PROCESSING',
          uploadedBy,
        },
      });

      // Process document asynchronously
      this.processDocument(document.id, file.buffer, file.mimetype).catch((error) => {
        this.logger.error(
          `[KnowledgeDocument] Failed to process document ${document.id}:`,
          error,
        );
      });

      return document;
    } catch (error) {
      this.logger.error('[KnowledgeDocument] Upload failed:', error);
      throw new BadRequestException(
        `Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async deleteDocument(id: string) {
    const document = await this.prisma.botKnowledgeDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new BadRequestException('Document not found');
    }

    // Delete from Supabase Storage (optional - keep for audit)
    // await this.storageService.deleteFile('knowledge-documents', document.storagePath);

    // Delete from database (cascade deletes chunks)
    await this.prisma.botKnowledgeDocument.delete({
      where: { id },
    });

    this.logger.log(`[KnowledgeDocument] Document ${id} deleted`);
  }

  private async processDocument(
    documentId: string,
    buffer: Buffer,
    mimeType: string,
  ) {
    this.logger.log(`[KnowledgeDocument] Processing document ${documentId}`);

    try {
      // Extract text based on MIME type
      let text: string;

      if (mimeType === 'text/plain') {
        text = buffer.toString('utf-8');
      } else if (mimeType === 'application/pdf') {
        text = await this.extractTextFromPDF(buffer);
      } else if (
        mimeType ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
      ) {
        text = await this.extractTextFromDOCX(buffer);
      } else {
        throw new Error(`Unsupported MIME type: ${mimeType}`);
      }

      // Clean text
      text = this.cleanText(text);

      if (!text || text.length < 10) {
        throw new Error('Extracted text is too short or empty');
      }

      this.logger.log(
        `[KnowledgeDocument] Extracted ${text.length} characters from document ${documentId}`,
      );

      // Chunk text
      const chunks = this.chunkText(text);

      this.logger.log(
        `[KnowledgeDocument] Created ${chunks.length} chunks from document ${documentId}`,
      );

      // Update document with content and status
      await this.prisma.botKnowledgeDocument.update({
        where: { id: documentId },
        data: {
          content: text,
          status: 'READY',
          chunkCount: chunks.length,
        },
      });

      // Save chunks
      await this.prisma.botKnowledgeChunk.createMany({
        data: chunks.map((chunk, index) => ({
          documentId,
          content: chunk,
          chunkIndex: index,
        })),
      });

      this.logger.log(
        `[KnowledgeDocument] Document ${documentId} processed successfully`,
      );
    } catch (error) {
      this.logger.error(
        `[KnowledgeDocument] Failed to process document ${documentId}:`,
        error,
      );

      // Update document with error status
      await this.prisma.botKnowledgeDocument.update({
        where: { id: documentId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private chunkText(text: string): string[] {
    const chunks: string[] = [];
    let currentIndex = 0;
    const MAX_CHUNKS = 1000; // Safety limit to prevent infinite loops
    let chunkCount = 0;

    while (currentIndex < text.length && chunkCount < MAX_CHUNKS) {
      const endIndex = Math.min(
        currentIndex + this.CHUNK_SIZE,
        text.length,
      );

      // Try to break at sentence boundary
      let breakIndex = endIndex;
      const lastPeriod = text.lastIndexOf('.', endIndex);
      const lastQuestion = text.lastIndexOf('?', endIndex);
      const lastExclamation = text.lastIndexOf('!', endIndex);
      const lastNewline = text.lastIndexOf('\n', endIndex);

      const lastSentenceEnd = Math.max(
        lastPeriod,
        lastQuestion,
        lastExclamation,
      );

      if (
        lastSentenceEnd > currentIndex + this.CHUNK_SIZE / 2 &&
        lastSentenceEnd < endIndex
      ) {
        breakIndex = lastSentenceEnd + 1;
      } else if (
        lastNewline > currentIndex + this.CHUNK_SIZE / 2 &&
        lastNewline < endIndex
      ) {
        breakIndex = lastNewline + 1;
      }

      const chunk = text.substring(currentIndex, breakIndex).trim();
      if (chunk) {
        chunks.push(chunk);
        chunkCount++;
      }

      // Ensure we always move forward
      const nextIndex = breakIndex - this.CHUNK_OVERLAP;
      if (nextIndex <= currentIndex) {
        // If we're not moving forward, move to breakIndex + 1
        currentIndex = breakIndex + 1;
      } else {
        currentIndex = nextIndex;
      }

      // Safety: ensure we don't go backwards
      if (currentIndex < 0) currentIndex = 0;
    }

    if (chunkCount >= MAX_CHUNKS) {
      this.logger.warn(`[KB] Reached MAX_CHUNKS limit (${MAX_CHUNKS}), stopping chunking`);
    }

    return chunks;
  }

  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    // Simple PDF text extraction placeholder
    // In production, use pdf-parse or pdf-lib
    this.logger.warn('[KnowledgeDocument] PDF extraction not fully implemented');
    return 'PDF text extraction placeholder';
  }

  private async extractTextFromDOCX(buffer: Buffer): Promise<string> {
    // Simple DOCX text extraction placeholder
    // In production, use mammoth or docx library
    this.logger.warn('[KnowledgeDocument] DOCX extraction not fully implemented');
    return 'DOCX text extraction placeholder';
  }

  async getReadyChunks(): Promise<string[]> {
    const documents = await this.prisma.botKnowledgeDocument.findMany({
      where: { status: 'READY' },
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });

    const allChunks: string[] = [];
    for (const doc of documents) {
      for (const chunk of doc.chunks) {
        allChunks.push(chunk.content);
      }
    }

    return allChunks;
  }

  async searchChunks(query: string, limit: number = 5): Promise<string[]> {
    const allChunks = await this.getReadyChunks();
    const normalizedQuery = this.normalizeText(query);

    // Simple keyword matching (in production, use vector search)
    const scoredChunks = allChunks.map((chunk) => {
      const normalizedChunk = this.normalizeText(chunk);
      const score = this.calculateSimilarityScore(normalizedQuery, normalizedChunk);
      return { chunk, score };
    });

    const filteredChunks = scoredChunks
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return filteredChunks.map((item) => item.chunk);
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateSimilarityScore(query: string, text: string): number {
    const queryWords = query.split(' ').filter((w) => w.length > 2);
    const textWords = text.split(' ').filter((w) => w.length > 2);

    let score = 0;
    for (const word of queryWords) {
      if (textWords.includes(word)) {
        score += 1;
      }
    }

    return score;
  }

  async syncWebsiteContext(): Promise<{ chunksCreated: number; message: string; documentId?: string }> {
    const fileName = 'website-context.txt';
    const fs = require('fs');
    const path = require('path');

    this.logger.log('[KB] Starting sync of website-context.txt');

    // Try multiple possible paths for the file
    const possiblePaths = [
      process.cwd() + '/website-context.txt', // Same level as backend
      process.cwd() + '/../website-context.txt', // One level up
      path.join(__dirname, '../../../website-context.txt'), // From backend/src/modules/telegram
      path.join(__dirname, '../../../../website-context.txt'), // From backend/src/modules/telegram (if nested deeper)
    ];

    let filePath = '';
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        filePath = possiblePath;
        break;
      }
    }

    if (!filePath) {
      this.logger.error(`[KB] File not found. Tried paths: ${possiblePaths.join(', ')}`);
      throw new Error(`File not found. Tried paths: ${possiblePaths.join(', ')}`);
    }

    this.logger.log(`[KB] Reading file from: ${filePath}`);

    let documentId = '';

    try {
      const buffer = fs.readFileSync(filePath);
      const text = buffer.toString('utf-8');

      this.logger.log(`[KB] Content length: ${text.length} characters`);

      if (!text || text.length < 10) {
        throw new Error('File content is too short or empty');
      }

      // Find existing website-context document
      const existingDoc = await this.prisma.botKnowledgeDocument.findFirst({
        where: { fileName },
      });

      // Delete existing document and its chunks
      if (existingDoc) {
        this.logger.log(`[KB] Deleting existing document: ${existingDoc.id}`);
        await this.prisma.botKnowledgeChunk.deleteMany({
          where: { documentId: existingDoc.id },
        });
        await this.prisma.botKnowledgeDocument.delete({
          where: { id: existingDoc.id },
        });
      }

      // Disable other documents
      await this.prisma.botKnowledgeDocument.updateMany({
        where: { status: 'READY' },
        data: { status: 'DISABLED' },
      });

      // Clean text
      const cleanedText = this.cleanText(text);
      this.logger.log(`[KB] Cleaned text length: ${cleanedText.length} characters`);

      // Chunk text
      this.logger.log(`[KB] Creating chunks... (CHUNK_SIZE: ${this.CHUNK_SIZE}, OVERLAP: ${this.CHUNK_OVERLAP})`);
      const chunks = this.chunkText(cleanedText);

      this.logger.log(`[KB] Chunks created: ${chunks.length}`);

      // Create document record
      const document = await this.prisma.botKnowledgeDocument.create({
        data: {
          fileName,
          mimeType: 'text/plain',
          fileSize: buffer.length,
          storagePath: '', // No storage needed for source file
          status: 'READY',
          uploadedBy: 'SYSTEM',
          content: cleanedText,
          chunkCount: chunks.length,
        },
      });

      documentId = document.id;

      // Save chunks
      await this.prisma.botKnowledgeChunk.createMany({
        data: chunks.map((chunk, index) => ({
          documentId: document.id,
          content: chunk,
          chunkIndex: index,
        })),
      });

      this.logger.log(`[KB] READY - Document ID: ${document.id}, Chunks: ${chunks.length}`);

      return {
        chunksCreated: chunks.length,
        message: `Đã sync website-context.txt thành công với ${chunks.length} chunks.`,
        documentId: document.id,
      };
    } catch (error) {
      this.logger.error('[KB] ERROR - Failed to sync:', error);

      // Try to update document with ERROR status if we have a documentId
      if (documentId) {
        try {
          await this.prisma.botKnowledgeDocument.update({
            where: { id: documentId },
            data: {
              status: 'FAILED',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        } catch (updateError) {
          this.logger.error('[KB] Failed to update document status to ERROR:', updateError);
        }
      }

      throw new Error(
        `Failed to sync website-context.txt: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
