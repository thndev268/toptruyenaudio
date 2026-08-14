import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. StorageService will fail on upload.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  /**
   * Upload a file to Supabase Storage and return its public URL
   */
  async uploadFile(bucketName: string, path: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .upload(path, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Upload error: ${error.message}`);
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: publicData } = this.supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  }
}
