INSERT INTO "User" ("id", "name", "email", "role", "createdAt") VALUES
('user1-id', 'John Burger', 'owner1@test.com', 'RESTAURANT', NOW()),
('user2-id', 'Luigi Pizza', 'owner2@test.com', 'RESTAURANT', NOW());

INSERT INTO "Restaurant" ("id", "name", "image", "address", "category", "ownerId", "rating", "ratingCount", "isActive", "createdAt", "updatedAt") VALUES
('rest1-id', 'Burger King', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', '123 Main St, Santiago', 'Burgers', 'user1-id', 4.5, 0, true, NOW(), NOW()),
('rest2-id', 'Pizza Hut', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&q=80', '456 Oak Ave, Santiago', 'Pizza', 'user2-id', 4.5, 0, true, NOW(), NOW());

INSERT INTO "Product" ("id", "name", "description", "price", "image", "restaurantId", "isActive", "createdAt", "updatedAt") VALUES
('prod1-id', 'Whopper', 'Large Burger', 9.99, '🍔', 'rest1-id', true, NOW(), NOW()),
('prod2-id', 'Fries', 'Crispy Fries', 3.99, '🍟', 'rest1-id', true, NOW(), NOW()),
('prod3-id', 'Pepperoni Pizza', 'Large Pepperoni', 12.99, '🍕', 'rest2-id', true, NOW(), NOW()),
('prod4-id', 'Garlic Bread', 'Crispy Garlic Bread', 3.99, '🥖', 'rest2-id', true, NOW(), NOW());
