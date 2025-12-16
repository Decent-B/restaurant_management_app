# Database Seeding Documentation

## Overview

The database seeding system is implemented in `backend/analytics/management/commands/seed_db.py` and is controlled by the `DATABASE_SEEDING` environment variable. When enabled, it populates the database with comprehensive test data for development and testing purposes.

## Configuration

**Environment Variable**: `DATABASE_SEEDING`
- **Values**: `True`, `1`, `t` (case-insensitive) to enable
- **Default**: `False` (skips seeding)
- **Location**: Set in `docker-compose.yml` or `.env` file

## Seeding Process

When `DATABASE_SEEDING=True`, the system performs the following steps:

### 1. Data Cleanup (Destructive)
⚠️ **WARNING**: All existing data is deleted before seeding:
- Users (all roles)
- Menus and Menu Items
- Orders and Order Items
- Payments
- Feedback/Reviews

### 2. User Creation

#### Staff and Manager Users (5 total)
All staff passwords are set to: **`123`**

| Name | Role | Email |
|------|------|-------|
| Guy Fieri | Manager | fieri@example.com |
| Rachael Ray | Staff | ray@example.com |
| Michael Caines | Staff | caines@example.com |
| Jamie Oliver | Staff | oliver@example.com |
| Gordon Ramsay | Staff | ramsay@example.com |

#### Customer Users (7 total)
All customer passwords are set to: **`123`**

| Name | Email | Phone |
|------|-------|-------|
| nhugiap | giap.nn225441@sis.hust.edu.vn | 1234567890 |
| ducbinh | binh.nd225475@sis.hust.edu.vn | 0987654321 |
| ankhanh | khanh.ta225447@sis.hust.edu.vn | - |
| vietbao | bao.mv225474@sis.hust.edu.vn | 0123456789 |
| anhtu | tu.pa225463@sis.hust.edu.vn | 0123457789 |
| Kylian Mbappe | mbappe@example.com | 9876543210 |
| Lionel Messi | messi@example.com | - |

### 3. Menu Structure

Four main menus are created with associated menu items:

#### Set Menu (7 items)
- Set box 7.3 - ₫150,000
- Set box Gà 3 vị - ₫150,000
- Set box Hàn 1, 1.5, 2, 3 - ₫150,000 each
- Box Mandu - ₫120,000

#### Korean Food Menu (6 items)
- Carbonara Tteokbokki - ₫170,000
- Cơm cà ri thịt cốt lết chiên xù - ₫180,000
- Cơm trộn Bibimbap - ₫160,000
- Miến trộn - ₫120,000
- Ram Don - ₫120,000
- Tteokbokki chả cá - ₫140,000

#### Kimbap Menu (11 items)
- Kimbap variants (Bulgogi, cheese, tuna, fried, Cajun chicken, Galbi pork, BBQ beef rib, shrimp, char siu) - ₫130,000-₫160,000
- Kimbibi - ₫150,000

#### Drink Menu (8 items)
- Various teas (fruit, milk tea, lychee, passion fruit, etc.) - ₫45,000-₫55,000

**Total Menu Items**: 32 items across 4 menus

### 4. Order Generation

#### Manual Test Orders (4 orders)
Initial orders with specific configurations:
- **Order K** (ankhanh): Dine-In, PENDING status - ₫390,000
- **Order B** (ducbinh): Dine-In, PENDING status - ₫280,000
- **Order Messi**: Dine-In, COMPLETED status - ₫710,000
- **Order Mbappe**: Takeout, COMPLETED status - ₫380,000

#### Bulk Generated Orders (10,000 orders)
Randomly generated orders with the following characteristics:

**Date Range**: 365 days ending Jan 31, 2026
- Higher probability on weekends (80% weekend vs 20% weekday)

**Service Types** (weighted distribution):
- Dine-In: 60%
- Takeout: 30%
- Delivery: 10%

**Group Sizes** (weighted distribution):
- 1 person: 20%
- 2 people: 25%
- 3 people: 15%
- 4 people: 10%
- 5 people: 10%
- 6 people: 8%
- 7 people: 7%
- 8 people: 5%

**Items per Order**:
- Range: 1-2 items per person in group
- Randomly selected from all 32 menu items
- Total price calculated from item prices

**Order Properties**:
- All orders marked as COMPLETED
- Random customer assignment from 7 customers
- Automatic payment creation (CASH or ONLINE_BANKING)
- All payments marked as "paid"

### 5. Feedback/Reviews

#### Manual Feedback (2 entries)
- Mbappe: 5 stars - "Great service!"
- Messi: 4 stars - "The food was delicious, but the drinks were too sweet."

#### Bulk Generated Feedback (1,412 entries)
**Rating Distribution** (weighted):
- 5 stars: 40%
- 4 stars: 31%
- 3 stars: 14%
- 2 stars: 5%
- 1 star: 10%

**Properties**:
- No comments (empty strings)
- Random customer assignment
- Random timestamps within last 365 days
- Not associated with specific orders

**Total Feedback Entries**: 1,414 (2 manual + 1,412 generated)

## Data Statistics Summary

| Category | Count |
|----------|-------|
| Staff/Managers | 5 |
| Customers | 7 |
| Menus | 4 |
| Menu Items | 32 |
| Initial Orders | 4 |
| Generated Orders | 10,000 |
| Total Orders | 10,004 |
| Payments | 10,004 |
| Feedback Entries | 1,414 |

## Technical Implementation

### Random Seed
- Fixed seed: `random.seed(10)`
- Ensures reproducible data generation across runs

### Bulk Creation
Uses Django's `bulk_create()` for performance:
- 10,000 orders created at once
- Associated order items created in bulk
- 10,000 payments created in bulk
- 1,412 feedback entries created in bulk

### Date/Time Generation
- Custom `get_random_datetime()` function
- Timezone-aware datetime objects
- Weighted distribution for weekends vs weekdays

## Usage

### Running the Seeding Command

**Via Docker Compose** (automatic on container start):
```bash
# Set in docker-compose.yml
environment:
  - DATABASE_SEEDING=True
```

**Manual execution**:
```bash
docker-compose exec backend python manage.py seed_db
```

### Login Credentials

After seeding, use these credentials:

**Manager Access**:
- Username: `Guy Fieri`
- Password: `123`

**Staff Access**:
- Username: `Rachael Ray` (or any staff name)
- Password: `123`

**Customer Access**:
- Username: `nhugiap` (or any customer name)
- Password: `123`

## Important Notes

1. **Destructive Operation**: Seeding DELETES all existing data first
2. **Production Safety**: Always set `DATABASE_SEEDING=False` in production
3. **Performance**: Generating 10,000 orders takes several seconds on container startup
4. **Passwords**: All seeded users have the same password: `123`
5. **Images**: Menu item images must exist in `backend/media/menu_item_images/`
6. **Timezone**: All timestamps are timezone-aware (Django's `make_aware()`)

## Data Patterns

### Revenue Simulation
- Realistic order totals based on group sizes
- 1-16 items per order (1-2 per person)
- Price range: ₫45,000 - ₫180,000 per item
- Average order: ₫300,000 - ₫600,000

### Customer Behavior
- 7 customers generating 10,000+ orders (high volume for testing)
- Preference for Dine-In service
- Weekend preference for dining
- Groups of 1-3 people most common

### Rating Distribution
- Skewed positive (71% are 4-5 stars)
- Matches typical restaurant rating patterns
- 15% negative feedback (1-2 stars)

## Maintenance

### Adding New Menu Items
Add to the seeding script in the appropriate menu section:
```python
menu_item_new = MenuItem.objects.create(
    name="New Item",
    description="Description",
    price=100000,
    menu=menu_korean_food,
    image="menu_item_images/new-item.png"
)
```

Then add to `all_menu_items` list for random order generation.

### Modifying Order Volume
Change the loop count:
```python
for _ in range(10_000):  # Change this number
```

### Adjusting Rating Distribution
Modify weights in feedback generation:
```python
rating=random.choices([1, 2, 3, 4, 5], weights=[10, 5, 14, 31, 40])[0]
```

## Troubleshooting

**Issue**: Images not displaying
- **Solution**: Ensure image files exist in `backend/media/menu_item_images/`

**Issue**: Seeding takes too long
- **Solution**: Reduce order count or disable `DATABASE_SEEDING` after initial setup

**Issue**: Cannot login after seeding
- **Solution**: All passwords are `123` - use exact username (case-sensitive)

**Issue**: Database size too large
- **Solution**: Reduce order count or clear old data before reseeding
