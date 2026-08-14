# Đặc Tả Mô Hình Dữ Liệu MongoDB (17 Collections)

## Quy Ước Bắt Buộc
- Tên collection: `camelCase` số nhiều.
- Tên trường: `camelCase` tiếng Anh.
- Document chuẩn luôn có: `_id` (ObjectId), `createdAt` (Date UTC), `updatedAt` (Date UTC), `deletedAt` (Date|null), `schemaVersion` (Number).
- Không tự ý nhúng document lớn (như toàn bộ nội dung chương hay toàn bộ lịch sử giao dịch).

---

## Danh Sách 17 Collections Chuẩn

### 1. `users`
Tài khoản, vai trò và trạng thái đăng nhập.
- `email`: String (unique, lowercase)
- `passwordHash`: String
- `displayName`: String
- `avatarUrl`: String|null
- `roles`: String[] (`USER`, `CREATOR`, `PARTNER`, `REVIEWER`, `ADMIN`)
- `status`: String (`PENDING`, `ACTIVE`, `SUSPENDED`, `BANNED`)
- `emailVerifiedAt`: Date|null
- `lastLoginAt`: Date|null
- `termsVersion`: String
- `termsAcceptedAt`: Date
- `security`: { `failedLogins`: Number, `lockedUntil`: Date|null }

### 2. `userProfiles`
Hồ sơ mở rộng người dùng.
- `userId`: ObjectId (ref `users`, unique)
- `bio`: String
- `dateOfBirth`: Date|null
- `countryCode`: String
- `preferences`: { `theme`: String, `fontSize`: Number, `readerBg`: String }
- `notification`: { `email`: Boolean }

### 3. `genres`
Danh mục thể loại truyện.
- `name`: String (unique)
- `slug`: String (unique)
- `description`: String
- `status`: String (`ACTIVE`, `HIDDEN`)
- `sortOrder`: Number

### 4. `stories`
Thông tin cấp bộ truyện.
- `creatorId`: ObjectId (ref `users`)
- `title`: String
- `slug`: String (unique)
- `summary`: String
- `coverUrl`: String|null
- `authorName`: String
- `genreIds`: ObjectId[] (ref `genres`)
- `contentTypes`: String[] (`TEXT`, `AUDIO`, `VIDEO`)
- `storyStatus`: String (`ONGOING`, `COMPLETED`, `HIATUS`)
- `publishStatus`: String (`DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `REJECTED`, `HIDDEN`)
- `ageRating`: String (`ALL`, `TEEN`, `MATURE`)
- `rightsId`: ObjectId (ref `contentRights`)
- `publishedAt`: Date|null
- `stats`: { `chapterCount`: Number, `viewCount`: Number, `favoriteCount`: Number }

### 5. `chapters`
Nội dung chi tiết từng chương.
- `storyId`: ObjectId (ref `stories`)
- `number`: Number
- `title`: String
- `slug`: String
- `contentText`: String|null
- `audioUrl`: String|null
- `video`: { `provider`: String|null, `externalId`: String|null }
- `durationSeconds`: Number|null
- `isFree`: Boolean
- `priceVnd`: Number
- `publishStatus`: String (`DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `REJECTED`, `HIDDEN`)
- `publishedAt`: Date|null
*(Index bắt buộc: `{ storyId: 1, number: 1 }` unique)*

### 6. `contentRights`
Bằng chứng sở hữu/ủy quyền nội dung.
- `ownerType`: String (`CREATOR`, `PARTNER`, `PLATFORM`)
- `ownerId`: ObjectId (ref `users`)
- `rightsType`: String (`OWNED`, `LICENSED`, `PUBLIC_DOMAIN`, `PARTNER_EMBED`)
- `commercialUse`: Boolean
- `modificationAllowed`: Boolean
- `sourceUrl`: String|null
- `evidenceFileUrls`: String[]
- `licenseName`: String|null
- `validFrom`: Date|null
- `validUntil`: Date|null
- `reviewStatus`: String (`PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`)
- `reviewedBy`: ObjectId|null
- `reviewedAt`: Date|null
- `reviewNote`: String|null

### 7. `creatorApplications`
Hồ sơ đăng ký Creator.
- `userId`: ObjectId (ref `users`)
- `status`: String (`DRAFT`, `SUBMITTED`, `REVIEWING`, `NEEDS_INFO`, `APPROVED`, `REJECTED`, `WITHDRAWN`)
- `legalName`: String
- `penName`: String
- `introduction`: String
- `contentPlan`: String
- `portfolioUrls`: String[]
- `rightsCommitment`: Boolean
- `submittedAt`: Date|null
- `reviewerId`: ObjectId|null
- `decisionReason`: String|null
- `decidedAt`: Date|null

### 8. `partnerApplications`
Hồ sơ Creator đăng ký chương trình Đối tác.
- `creatorId`: ObjectId (ref `users`)
- `status`: String (`SUBMITTED`, `REVIEWING`, `APPROVED`, `REJECTED`, `SUSPENDED`)
- `channelName`: String
- `channelUrl`: String
- `platform`: String
- `metricsSnapshot`: Object
- `commissionBps`: Number
- `referralCode`: String|null
- `reviewerId`: ObjectId|null
- `decisionReason`: String|null
- `approvedAt`: Date|null

### 9. `favorites`
Danh sách truyện yêu thích của độc giả.
- `userId`: ObjectId (ref `users`)
- `storyId`: ObjectId (ref `stories`)
*(Index: `{ userId: 1, storyId: 1 }` unique)*

### 10. `readingProgress`
Tiến độ đọc của người dùng.
- `userId`: ObjectId (ref `users`)
- `storyId`: ObjectId (ref `stories`)
- `chapterId`: ObjectId (ref `chapters`)
- `position`: Number
- `percent`: Number
- `lastReadAt`: Date
*(Index: `{ userId: 1, storyId: 1 }` unique)*

### 11. `paymentPackages` & `paymentOrders`
Gói nạp tiền và Đơn thanh toán.
- **paymentPackages**: `code` (unique), `name`, `priceVnd`, `creditAmount`, `status`
- **paymentOrders**: `orderCode` (unique), `userId`, `packageId`, `expectedAmountVnd`, `creditAmount`, `provider`, `providerTxnId`, `status`, `idempotencyKey`, `paidAt`, `expiresAt`

### 12. `wallets` & `ledgerEntries`
Quản lý ví và Sổ cái kế toán đôi (Ledger).
- **wallets**: `ownerType`, `ownerId`, `walletType` (`USER_CREDIT`, `PARTNER_EARNING`, `PARTNER_CAMPAIGN`), `currency`, `available`, `pending`, `version`
- **ledgerEntries**: `walletId`, `direction` (`CREDIT`, `DEBIT`), `amountVnd`, `balanceAfter`, `entryType`, `referenceType`, `referenceId`, `idempotencyKey` (unique), `reversalOf`

### 13. `withdrawalRequests`
Yêu cầu rút tiền thu nhập của Đối tác.
- `partnerId`: ObjectId
- `walletId`: ObjectId
- `amountVnd`: Number
- `feeVnd`: Number
- `netAmountVnd`: Number
- `payoutMethodId`: ObjectId
- `status`: String (`REQUESTED`, `REVIEWING`, `APPROVED`, `PROCESSING`, `PAID`, `REJECTED`, `CANCELLED`)
- `reviewerId`: ObjectId|null
- `decisionReason`: String|null
- `providerReference`: String|null
- `paidAt`: Date|null

### 14. `webhookEvents`
Lưu vết sự kiện Webhook từ cổng thanh toán.
- `provider`: String
- `providerEventId`: String (unique)
- `eventType`: String
- `signatureValid`: Boolean
- `payloadHash`: String
- `orderCode`: String|null
- `status`: String (`RECEIVED`, `PROCESSED`, `IGNORED`, `FAILED`)
- `attemptCount`: Number
- `processedAt`: Date|null
- `errorCode`: String|null

### 15. `affiliateEvents` & `commissions`
Theo dõi tiếp thị liên kết và tính hoa hồng.
- **affiliateEvents**: `referralCode`, `partnerId`, `visitorId`, `type` (`CLICK`, `SIGNUP`, `PURCHASE`), `orderId`
- **commissions**: `partnerId`, `orderId`, `baseAmountVnd`, `rateBps`, `amountVnd`, `status`, `availableAt`

### 16. `auditLogs`
Nhật ký hành động bất biến của Admin / Reviewer.
- `actorId`: ObjectId|null
- `action`: String
- `targetType`: String
- `targetId`: ObjectId
- `before`: Object|null
- `after`: Object|null
- `reason`: String|null
- `requestId`: String

### 17. `reports`
Báo cáo vi phạm nội dung từ độc giả.
- `reporterId`: ObjectId|null
- `targetType`: String (`STORY`, `CHAPTER`, `COMMENT`)
- `targetId`: ObjectId
- `reasonCode`: String
- `description`: String
- `status`: String (`OPEN`, `REVIEWING`, `RESOLVED`, `REJECTED`)
