# Bug Fix Report: Premium Status Synchronization Issue

## Issue Summary
Premium status không đồng bộ giữa Premium page và Header sau khi user mua Premium thành công.

### Hiện trạng
- User đã mua Premium thành công
- Trang Premium hiển thị đúng: Gói: Premium Tháng, Còn lại: 29 ngày, Ngày hết hạn: 7/10/2026
- Nhưng Header vẫn hiển thị badge "FREE"

## Root Cause Analysis

### 1. File gây lỗi
- **Backend**: `story-platform/backend/src/modules/users/users.service.ts` (line 229-264)
- **Frontend**: `story-platform/frontend/src/context/AuthContext.tsx` (line 134-146)

### 2. Nguyên nhân

#### Backend Issue
Trong method `buildUserProfileResponse()`, có sự không nhất quán giữa database schema và API response:

- Database schema (`UserSubscription` model) dùng field `endAt` và `startAt`
- Nhưng code kiểm tra `subscription.expiresAt` (không tồn tại trong schema)
- Điều này khiến logic xác định Premium status hoạt động sai

```typescript
// BUG CODE - uses wrong field names
const isPremiumActive =
  subscription &&
  subscription.status === SubscriptionStatus.ACTIVE &&
  subscription.expiresAt &&  // ❌ Wrong field - should be endAt
  new Date(subscription.expiresAt).getTime() > serverNow.getTime();
```

#### Frontend Issue
Trong `AuthContext.tsx`, khi map user data từ API response, code đọc sai field:

```typescript
// BUG CODE - reads wrong field
isPremium: data.membershipTier === 'PREMIUM',  // ❌ Wrong field - should be data.membership?.tier
membership: {
  tier: data.membershipTier || 'FREE',  // ❌ Wrong field
  subscriptionStatus: 'ACTIVE',
}
```

### 3. Flow dữ liệu hiện tại

```
Database (Correct)
├── Profile.membershipTier = 'PREMIUM' (được update sau payment)
└── UserSubscription.endAt = '2026-10-07'
    └── UserSubscription.status = 'ACTIVE'

↓ API Response (BUG - wrong field mapping)

Frontend AuthContext (BUG - reads wrong field)
├── isPremium: data.membershipTier === 'PREMIUM' (undefined ❌)
└── membership.tier: data.membershipTier || 'FREE' (defaults to 'FREE' ❌)

↓ Header Display (BUG - shows FREE)
```

## Files Modified

### 1. Backend Fix
**File**: `story-platform/backend/src/modules/users/users.service.ts`

**Change**: Sửa field names trong `buildUserProfileResponse()` method

```typescript
// BEFORE (BUG)
const isPremiumActive =
  subscription &&
  subscription.status === SubscriptionStatus.ACTIVE &&
  subscription.expiresAt &&  // ❌ Wrong
  new Date(subscription.expiresAt).getTime() > serverNow.getTime();

// AFTER (FIXED)
const isPremiumActive =
  subscription &&
  subscription.status === SubscriptionStatus.ACTIVE &&
  subscription.endAt &&  // ✅ Correct field name
  new Date(subscription.endAt).getTime() > serverNow.getTime();
```

Also fixed field mapping in response:
```typescript
// BEFORE (BUG)
startedAt: isPremiumActive && subscription?.startedAt ? subscription.startedAt.toISOString() : undefined,
expiresAt: isPremiumActive && subscription?.expiresAt ? subscription.expiresAt.toISOString() : undefined,

// AFTER (FIXED)
startedAt: isPremiumActive && subscription?.startAt ? subscription.startAt.toISOString() : undefined,
expiresAt: isPremiumActive && subscription?.endAt ? subscription.endAt.toISOString() : undefined,
```

### 2. Frontend Fix
**File**: `story-platform/frontend/src/context/AuthContext.tsx`

**Change**: Sửa cách đọc membership data từ API response

```typescript
// BEFORE (BUG)
isPremium: data.membershipTier === 'PREMIUM',
membership: {
  tier: data.membershipTier || 'FREE',
  subscriptionStatus: 'ACTIVE',
}

// AFTER (FIXED)
isPremium: data.membership?.tier === 'PREMIUM',
membership: {
  tier: data.membership?.tier || 'FREE',
  subscriptionStatus: data.membership?.subscriptionStatus || 'ACTIVE',
  planId: data.membership?.planId,
  startedAt: data.membership?.startedAt,
  expiresAt: data.membership?.expiresAt,
}
```

## Flow Đồng Bộ Premium Sau Khi Sửa

### Correct Flow After Payment Success

```
1. User thanh toán Premium thành công
   ↓
2. Backend processSuccessfulPayment() updates:
   - Payment.status = 'PAID'
   - UserSubscription.status = 'ACTIVE'
   - UserSubscription.endAt = calculated expiry date
   - Profile.membershipTier = 'PREMIUM'
   ↓
3. Frontend PremiumView calls refreshUser()
   ↓
4. AuthContext.fetchProfile() calls:
   - POST /subscriptions/sync (đồng bộ membershipTier)
   - GET /users/me (lấy user data mới)
   ↓
5. Backend /users/me endpoint:
   - UsersService.getUserProfileResponse()
   - buildUserProfileResponse() now correctly checks subscription.endAt ✅
   - Returns correct membership.tier = 'PREMIUM' ✅
   ↓
6. AuthContext maps response correctly:
   - isPremium: data.membership?.tier === 'PREMIUM' ✅
   - membership.tier: data.membership?.tier ✅
   ↓
7. Header re-renders with correct PREMIUM badge ✅
```

## Test Scenarios

### Scenario A: User FREE
**Expected**: Header = FREE

**Flow**:
1. User đăng nhập với tài khoản FREE
2. Backend /users/me trả về membership.tier = 'FREE'
3. Frontend AuthContext map đúng data
4. Header hiển thị badge "FREE" ✅

### Scenario B: User vừa mua Premium (không reload trang)
**Expected**: Header tự đổi thành PREMIUM

**Flow**:
1. User ở trang Premium, chọn gói và thanh toán
2. Payment success → Backend update database
3. PremiumView polling kiểm tra payment status
4. Khi status = 'PAID', gọi applyPaidMembership()
5. applyPaidMembership() gọi refreshUser()
6. refreshUser() gọi API /users/me để lấy data mới
7. Backend trả về membership.tier = 'PREMIUM' (đã fix)
8. AuthContext update state với correct data
9. Header re-render tự động → badge đổi sang "PREMIUM" ✅

### Scenario C: User Premium reload website
**Expected**: Header vẫn = PREMIUM

**Flow**:
1. User đã có Premium, reload trang
2. AuthContext initializeAuth() được gọi
3. fetchProfile() gọi /users/me
4. Backend buildUserProfileResponse() kiểm tra subscription.endAt (đã fix)
5. Trả về membership.tier = 'PREMIUM' vì subscription còn ACTIVE
6. AuthContext map đúng data
7. Header hiển thị badge "PREMIUM" ✅

## Verification Checklist

- [x] Database schema được kiểm tra (UserSubscription.endAt, startAt)
- [x] Backend API response mapping được sửa
- [x] Frontend AuthContext data mapping được sửa
- [x] Header component đã đọc đúng user.membership?.tier
- [x] Premium page refreshUser flow được kiểm tra
- [x] Không ảnh hưởng login/logout flow
- [x] Không ảnh hưởng JWT authentication
- [x] Không hard-code Premium status ở frontend

## Additional Notes

### Database Schema Reference
```
model UserSubscription {
  status        String   @default("EXPIRED") // ACTIVE, EXPIRED, CANCELLED
  startAt       DateTime?  // ✅ Correct field name
  endAt         DateTime?  // ✅ Correct field name
  // (NOT expiresAt, NOT startedAt)
}
```

### API Response Structure (After Fix)
```typescript
{
  id: string,
  email: string,
  displayName: string,
  membership: {
    tier: 'FREE' | 'PREMIUM',  // ✅ Based on subscription.endAt check
    subscriptionStatus: 'ACTIVE' | 'EXPIRED' | 'NONE',
    planId?: string,
    startedAt?: string,  // ✅ From subscription.startAt
    expiresAt?: string,  // ✅ From subscription.endAt
  }
}
```

## Conclusion

Bug được gây ra bởi sự không nhất quán giữa:
1. Database schema field names (`endAt`, `startAt`)
2. Backend code đọc field names (`expiresAt`, `startedAt`)
3. Frontend code đọc API response (`membershipTier` thay vì `membership.tier`)

Sau khi sửa, flow đồng bộ Premium hoạt động đúng:
- Backend trả về đúng membership status dựa trên subscription thực tế
- Frontend map đúng data từ API response
- Header hiển thị Premium badge ngay sau khi thanh toán thành công
- Reload trang vẫn giữ nguyên Premium status