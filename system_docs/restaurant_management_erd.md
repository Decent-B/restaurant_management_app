# Restaurant Management Database ERD (Markdown)

## Tables

### `user`
| Column | Type | Key | References |
|---|---|---|---|
| `id` | `int` | **PK** | — |
| `name` | `varchar(100)` | — | — |
| `email` | `varchar(200)` | — | — |
| `hashed_password` | `varchar(128)` | — | — |
| `phone_num` | `varchar(20)` | — | — |
| `role` | `varchar(20)` | — | — |
| `time_created` | `datetime` | — | — |

**Notes:**
- `role` field uses CHOICES: 'DINER', 'STAFF', 'MANAGER', 'CHEF', 'WAITER'
- Replaces separate Staff and Diner tables with unified User model

### `menu`
| Column | Type | Key | References |
|---|---|---|---|
| `id` | `int` | **PK** | — |
| `name` | `varchar(100)` | — | — |
| `description` | `varchar(500)` | — | — |
| `image` | `ImageField` | — | — |

**Notes:**
- `image` is Django's ImageField (stores file in `menu_images/` directory)

### `menu_item`
| Column | Type | Key | References |
|---|---|---|---|
| `id` | `int` | **PK** | — |
| `name` | `varchar(100)` | — | — |
| `description` | `varchar(500)` | — | — |
| `price` | `decimal(8,2)` | — | — |
| `image` | `ImageField` | — | — |
| `menu_id` | `int` | **FK** | `menu(id)` |
| `last_modified` | `datetime` | — | — |

**Notes:**
- `image` is Django's ImageField (stores file in `menu_item_images/` directory)
- `price` uses DecimalField for accurate currency representation
- `last_modified` auto-updates on save

### `order`
| Column | Type | Key | References |
|---|---|---|---|
| `id` | `int` | **PK** | — |
| `status` | `varchar(15)` | — | — |
| `service_type` | `varchar(50)` | — | — |
| `note` | `varchar(200)` | — | — |
| `total_price` | `decimal(10,2)` | — | — |
| `time_created` | `datetime` | — | — |
| `last_modified` | `datetime` | — | — |
| `diner_id` | `int` | **FK** | `user(id)` |

**Notes:**
- `status` field uses CHOICES: 'PENDING', 'COMPLETED', 'CANCELED'
- `diner_id` references users with role='DINER'
- `last_modified` auto-updates on save

### `order_item`
| Column | Type | Key | References |
|---|---|---|---|
| `id` | `int` | **PK** | — |
| `menu_item_id` | `int` | **FK** | `menu_item(id)` |
| `order_id` | `int` | **FK** | `order(id)` |
| `quantity` | `int` | — | — |

### `payment`
| Column | Type | Key | References |
|---|---|---|---|
| `id` | `int` | **PK** | — |
| `order_id` | `int` | **FK** | `order(id)` |
| `method` | `varchar(20)` | — | — |
| `time_created` | `datetime` | — | — |
| `status` | `varchar(15)` | — | — |

**Notes:**
- `method` field uses CHOICES: 'CASH', 'ONLINE_BANKING'
- One-to-one relationship with Order

### `feedback`
| Column | Type | Key | References |
|---|---|---|---|
| `id` | `int` | **PK** | — |
| `order_id` | `int` | **FK** | `order(id)` |
| `diner_id` | `int` | **FK** | `user(id)` |
| `rating` | `int` | — | — |
| `comment` | `text` | — | — |
| `time_created` | `datetime` | — | — |

**Notes:**
- `order_id` is nullable (feedback can exist without an order)
- `diner_id` references users with role='DINER'
- `comment` is TextField (unlimited length) for flexible feedback

## Relationships (Foreign Keys)

- `menu_item.menu_id` → `menu(id)` - CASCADE delete
- `order.diner_id` → `user(id)` - CASCADE delete (limited to role='DINER')
- `order_item.menu_item_id` → `menu_item(id)` - CASCADE delete
- `order_item.order_id` → `order(id)` - CASCADE delete
- `payment.order_id` → `order(id)` - CASCADE delete (one-to-one)
- `feedback.order_id` → `order(id)` - CASCADE delete (nullable)
- `feedback.diner_id` → `user(id)` - CASCADE delete (limited to role='DINER')

## Implementation Notes

This ERD reflects the actual Django ORM implementation with the following design decisions:

1. **Unified User Model**: Combines staff and diners into a single `user` table with role-based differentiation
2. **Django Field Types**: Uses Django-specific field types (ImageField, DecimalField, TextField) for better functionality
3. **Automatic Timestamps**: `last_modified` fields use `auto_now=True` for automatic updates
4. **Choice Fields**: Uses Django CHOICES for constrained string fields (status, role, method)
5. **Backward Compatibility**: Code maintains `Staff` and `Diner` as aliases to `User` for gradual migration
