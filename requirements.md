```markdown
# Street Vendor-Customer Connection Application Documentation

## Table of Contents
1. [Database Schema](#database-schema)
2. [Application Flow](#application-flow)
3. [Technical Stack](#technical-stack)
4. [System Architecture](#system-architecture)
5. [Key Features](#key-features)
6. [Real-Time Location Handling](#real-time-location-handling)
7. [Authentication & Security](#authentication--security)
8. [Notifications](#notifications)
9. [Challenges & Solutions](#challenges--solutions)

---

## Database Schema

### Tables & Relationships

#### 1. `USERS`
- **Fields**:
  - `phone_number` (Primary Key, String)
  - `isVerified` (Boolean)
  - `userType` (Enum: "seller" or "buyer")
- **Description**: Base table for all users. `userType` determines if the user is linked to the `seller` or `buyer` table.

#### 2. `seller`
- **Fields**:
  - `seller_id` (Primary Key, UUID)
  - `phone_number` (Foreign Key to `USERS`)
  - `name` (String)
  - `current_location` (GeoJSON/PostGIS Geography)
  - `logo` (URL to image)
  - `address` (String)
  - `isOpen` (Boolean)
- **Description**: Sellers share real-time location when `isOpen = true`.

#### 3. `buyer`
- **Fields**:
  - `buyer_id` (Primary Key, UUID)
  - `phone_number` (Foreign Key to `USERS`)
  - `name` (String)
  - `current_location` (GeoJSON/PostGIS Geography)
  - `profile_pic` (URL to image)
  - `address` (String)
- **Description**: Buyers see sellers based on their `current_location`.

#### 4. `liked`
- **Fields**:
  - `seller_id` (Foreign Key to `seller`)
  - `buyer_id` (Foreign Key to `buyer`)
- **Description**: Many-to-many relationship for favoriting sellers/buyers.

#### 5. `Products`
- **Fields**:
  - `product_id` (Primary Key, UUID)
  - `seller_id` (Foreign Key to `seller`)
  - `name` (String)
  - `image` (URL)
  - `price` (Decimal with unit, e.g., "$5/kg")
  - `type` (Enum: "fruits", "vegetables", etc.)
- **Description**: Seller-specific product catalog.

#### 6. `Orders`
- **Fields**:
  - `order_id` (Primary Key, UUID)
  - `buyer_id` (Foreign Key to `buyer`)
  - `seller_id` (Foreign Key to `seller`)
  - `product_id` (Foreign Key to `Products`)
  - `quantity` (Integer)
  - `price` (Decimal)
  - `status` (Enum: "pending", "completed", "cancelled")
- **Description**: Tracks order lifecycle and payment details.

---

## Application Flow

### 1. Authentication & Onboarding
- **Step 1**: User selects role (buyer/seller) and enters phone number.
- **Step 2**: OTP verification via SMS (Twilio API).
- **Step 3**: Onboarding:
  - **Sellers**: Upload logo, set address, business hours.
  - **Buyers**: Upload profile picture, set address.

### 2. Seller Flow
- **Start Business**: Toggle `isOpen` to share real-time location.
- **Catalogue Management**: Add/update products with prices and units.
- **Orders Dashboard**:
  - **Pending Orders**: Accept/decline orders (updates `status`).
  - **Completed/Cancelled**: Historical records.
- **Customer List**: View buyers in radius (filter by `liked`).

### 3. Buyer Flow
- **Discover Sellers**:
  - Map/list of nearby sellers (sorted by distance).
  - Filter by product type or "liked" sellers.
- **Product View**:
  - Browse seller-specific catalog or global "Shop" section.
  - Place orders with quantity.
- **Order Tracking**:
  - Real-time updates on `status` (pending → completed/cancelled).
- **Liked Sellers**: Bookmark frequently used sellers.

---

## Technical Stack

### Frontend: **React Native**
- **Why**: Cross-platform (iOS/Android), large community, Expo for rapid development.
- **Key Libraries**:
  - `react-navigation` for routing.
  - `react-query` for API state management.
  - `react-native-maps` (Google Maps/Mapbox integration).

### Backend: **Node.js + Express.js**
- **Why**: Lightweight, scalable, and integrates seamlessly with React Native.
- **Key Libraries**:
  - `PostgreSQL` driver for database queries.
  - `Socket.io` for real-time location/order updates.
  - `Twilio` for OTP verification.

### Database: **Supabase (PostgreSQL)**
- **Why**:
  - Built-in real-time capabilities for location/order updates.
  - Relational structure fits the schema.
  - Auth and storage integrations.

### Maps: **Mapbox**
- **Why**: Cost-effective, customizable, and supports GeoJSON for location queries.
- **Features**:
  - Heatmaps for seller density.
  - Directions API for buyer-seller navigation.

### Storage: **Supabase Storage**
- **Why**: Direct integration with Supabase DB for product/seller images.

---

## System Architecture

```
Mobile App (React Native)
        │
        │ REST API / WebSocket
        ▼
Node.js Backend (Express.js)
        │
        │ PostgreSQL Queries
        ▼
   Supabase Database
        │
        │ Real-Time Updates
        ▼
Mobile App (Socket.io Listeners)
```

---

## Real-Time Location Handling
- **Seller Side**: 
  - When `isOpen = true`, app sends location updates every 30s via WebSocket.
  - Location stored as PostGIS `geography` type for spatial queries.
- **Buyer Side**:
  - Query sellers within 5km radius: 
    ```sql
    SELECT * FROM seller 
    WHERE ST_DWithin(current_location, :buyer_location, 5000) 
    AND isOpen = true;
    ```

---

## Authentication & Security
- **OTP Flow**: Twilio Verify API for SMS-based authentication.
- **Data Encryption**:
  - Supabase column-level encryption for sensitive fields (e.g., phone numbers).
  - HTTPS for all API calls.

---

## Notifications
- **Library**: Firebase Cloud Messaging (FCM).
- **Triggers**:
  - New order → Seller notification.
  - Order status change → Buyer notification.

---

## Challenges & Solutions
1. **Battery Drain from Real-Time Location**:
   - Throttle updates to 30s intervals.
   - Use background geolocation plugin optimizations.
2. **Scaling Spatial Queries**:
   - Add PostGIS indexes to `current_location`.
3. **Offline Support**:
   - Cache seller/product data locally with SQLite.
``` 

This documentation provides a foundation for development. Adjustments may be needed based on testing and user feedback.