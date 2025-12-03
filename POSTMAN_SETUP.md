# Postman API Testing Guide

## Setup Instructions

### 1. Import Collection
1. Open Postman
2. Click **Import** button (top left)
3. Select `postman_collection.json` file
4. The collection will be imported with all endpoints

### 2. Set Up Environment Variables
1. Click **Environments** in the left sidebar
2. Click **+** to create a new environment
3. Name it "E-commerce API - Local" or "E-commerce API - Production"
4. Add the following variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `http://localhost:5000` | `http://localhost:5000` |
| `access_token` | (leave empty) | (will be auto-filled after login) |
| `user_id` | (leave empty) | (will be auto-filled after login) |
| `product_id` | (leave empty) | (manually set after creating a product) |
| `order_id` | (leave empty) | (manually set after creating an order) |
| `admin_id` | (leave empty) | (manually set after creating an admin) |

5. Select the environment from the dropdown (top right)

### 3. Auto-Save Token
The **Login** request has a test script that automatically saves the `access_token` and `user_id` to environment variables after successful login.

## API Endpoints

### 🔐 Authentication (Public)
All auth endpoints are public and don't require authentication.

#### 1. Signup
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/signup`
- **Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

#### 2. Login ⭐ (Auto-saves token)
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/login`
- **Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```
- **Note:** This automatically saves `access_token` and `user_id` to environment variables

#### 3. Forget Password
- **Method:** `PATCH`
- **URL:** `{{base_url}}/api/auth/forgetPassword`
- **Body:**
```json
{
  "email": "user@example.com"
}
```

#### 4. Reset Password
- **Method:** `PATCH`
- **URL:** `{{base_url}}/api/auth/resetPassword`
- **Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

---

### 👥 Users (Admin/SuperAdmin Only)
All user endpoints require Bearer token authentication.

#### 1. Get Users
- **Method:** `GET`
- **URL:** `{{base_url}}/api/users`
- **Query Parameters:**
  - `page` (default: 1)
  - `rowsPerPage` (default: 10)
  - `search` (optional)
  - `sort` (asc/desc, default: desc)
  - `sortBy` (default: createdAt)

#### 2. Create User
- **Method:** `POST`
- **URL:** `{{base_url}}/api/users`
- **Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "role": "customer"
}
```

#### 3. Update User Status
- **Method:** `PATCH`
- **URL:** `{{base_url}}/api/users/:id/status`
- **Body:**
```json
{
  "status": "active" // or "blocked" or "deleted"
}
```

#### 4. Delete User
- **Method:** `DELETE`
- **URL:** `{{base_url}}/api/users/:id`

---

### 📦 Products

#### Public Endpoints

#### 1. Get Products
- **Method:** `GET`
- **URL:** `{{base_url}}/api/products`
- **Query Parameters:**
  - `page`, `rowsPerPage`, `search`, `category`, `status`, `sort`, `sortBy`

#### 2. Get Product By ID
- **Method:** `GET`
- **URL:** `{{base_url}}/api/products/:id`

#### Admin Only Endpoints

#### 3. Create Product
- **Method:** `POST`
- **URL:** `{{base_url}}/api/products`
- **Body:**
```json
{
  "name": "Product Name",
  "image": "https://example.com/image.jpg",
  "category": "Electronics",
  "price": 99.99,
  "description": "Product description",
  "colors": ["red", "blue"],
  "sizes": ["S", "M", "L"]
}
```

#### 4. Update Product
- **Method:** `PATCH`
- **URL:** `{{base_url}}/api/products/:id`
- **Body:** (all fields optional)
```json
{
  "name": "Updated Product Name",
  "price": 129.99,
  "description": "Updated description"
}
```

#### 5. Update Product Status
- **Method:** `PATCH`
- **URL:** `{{base_url}}/api/products/:id/status`
- **Body:**
```json
{
  "status": "inactive" // or "active" or "deleted"
}
```

#### 6. Delete Product
- **Method:** `DELETE`
- **URL:** `{{base_url}}/api/products/product/:id`

---

### 🛒 Orders (Authenticated)

#### 1. Create Order (Customer Only)
- **Method:** `POST`
- **URL:** `{{base_url}}/api/orders/cart`
- **Body:**
```json
{
  "items": [
    {
      "prod_id": "product_id_here",
      "count": 2,
      "size": "M",
      "color": "red",
      "price": 99.99
    }
  ],
  "address": "123 Main St, City, Country",
  "shipping": 10.00,
  "total": 209.98,
  "discount": 0,
  "notes": "Please handle with care",
  "phoneNumber": "+1234567890",
  "customerName": "John Doe"
}
```

#### 2. Get Orders
- **Method:** `GET`
- **URL:** `{{base_url}}/api/orders`
- **Query Parameters:** `page`, `rowsPerPage`, `status`, `sort`, `sortBy`

#### 3. Get Order By ID
- **Method:** `GET`
- **URL:** `{{base_url}}/api/orders/:id`

#### 4. Update Order Status (Admin/SuperAdmin Only)
- **Method:** `PATCH`
- **URL:** `{{base_url}}/api/orders/:id/status`
- **Body:**
```json
{
  "status": "shipped" // or "pending", "paid", "completed", "cancelled"
}
```

---

### 👑 Super Admin (SuperAdmin Only)

#### 1. Get Admins
- **Method:** `GET`
- **URL:** `{{base_url}}/api/super-admin`
- **Query Parameters:** `page`, `rowsPerPage`

#### 2. Create Admin
- **Method:** `POST`
- **URL:** `{{base_url}}/api/super-admin`
- **Body:**
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "numberOfUsers": 100
}
```

#### 3. Update Admin Status
- **Method:** `PATCH`
- **URL:** `{{base_url}}/api/super-admin/:id/status`
- **Body:**
```json
{
  "status": "active" // or "blocked" or "deleted"
}
```

---

## Testing Workflow

### Recommended Testing Order:

1. **Health Check** - Verify API is running
2. **Signup** - Create a test user
3. **Login** - Get access token (auto-saved)
4. **Get Products** - Test public endpoint
5. **Create Product** - Test authenticated endpoint
6. **Get Users** - Test admin endpoint
7. **Create Order** - Test customer endpoint
8. **Update Order Status** - Test admin endpoint

## Response Format

All responses follow this structure:

### Success Response:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  },
  "meta": {
    // Pagination metadata (if applicable)
    "page": 1,
    "rowsPerPage": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error message here",
  "errors": {
    // Validation errors (if applicable)
  }
}
```

## Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Tips

1. **Always login first** - Most endpoints require authentication
2. **Check token expiration** - If you get 401 errors, login again
3. **Use environment variables** - Update `product_id`, `order_id`, etc. after creating resources
4. **Test error cases** - Try invalid data to see validation errors
5. **Check response structure** - All responses have `success`, `message`, and `data` fields

## Troubleshooting

### 401 Unauthorized
- Token expired or missing
- Solution: Login again to get a new token

### 403 Forbidden
- User doesn't have required role
- Solution: Login with an admin/superAdmin account

### 400 Bad Request
- Validation error
- Check the `errors` field in response for details

### Connection Error
- Server not running
- Check if backend is running on `http://localhost:5000`
- Verify `base_url` in environment variables

