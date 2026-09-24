# Table Cardinalities

| ID | Parent Table | Child Table | Parents per Child | Children per Parent |
|---|---|---|---|---|
| R01 | STUDENT | USER_ACCOUNT | 0..1 | 0..1 |
| R02 | LABORATORY | USER_ACCOUNT | 0..1 | 0..many |
| R03 | TERM | CLASS_GROUP | 1 | 0..many |
| R04 | USER_ACCOUNT | CLASS_GROUP | 1 | 0..many |
| R05 | USER_ACCOUNT | CLASS_GROUP | 1 | 0..many |
| R06 | CLASS_GROUP | GROUP_MEMBER | 1 | 0..many |
| R07 | STUDENT | GROUP_MEMBER | 1 | 0..many |
| R08 | LABORATORY | SCHEDULE_BLOCK | 1 | 0..many |
| R09 | TERM | SCHEDULE_BLOCK | 1 | 0..many |
| R10 | CLASS_GROUP | SCHEDULE_BLOCK | 0..1 | 0..many |
| R11 | USER_ACCOUNT | RESERVATION | 1 | 0..many |
| R12 | CLASS_GROUP | RESERVATION | 1 | 0..many |
| R13 | RESERVATION | REQUEST_REVISION | 1 | 0..many |
| R14 | LABORATORY | REQUEST_REVISION | 1 | 0..many |
| R15 | SCHEDULE_BLOCK | REQUEST_REVISION | 0..1 | 0..many |
| R16 | USER_ACCOUNT | REQUEST_REVISION | 1 | 0..many |
| R17 | REQUEST_REVISION | APPROVAL | 1 | 0..1 |
| R18 | USER_ACCOUNT | APPROVAL | 1 | 0..many |
| R19 | REQUEST_REVISION | REQUEST_ITEM | 1 | 0..many |
| R20 | ITEM | REQUEST_ITEM | 1 | 0..many |
| R21 | REQUEST_REVISION | REQUEST_MEMBER | 1 | 0..many |
| R22 | STUDENT | REQUEST_MEMBER | 1 | 0..many |
| R23 | REQUEST_REVISION | BORROWING | 1 | 0..many |
| R24 | USER_ACCOUNT | BORROWING | 1 | 0..many |
| R25 | BORROWING | BORROWING_ITEM | 1 | 0..many |
| R26 | REQUEST_ITEM | BORROWING_ITEM | 1 | 0..many |
| R27 | BORROWING | BORROWING_MEMBER | 1 | 0..many |
| R28 | REQUEST_MEMBER | BORROWING_MEMBER | 1 | 0..many |
| R29 | BORROWING_ITEM | RETURN_ENTRY | 1 | 0..many |
| R30 | USER_ACCOUNT | RETURN_ENTRY | 1 | 0..many |
| R31 | RETURN_ENTRY | CLEARANCE | 1 | 0..many |
| R32 | BORROWING_MEMBER | CLEARANCE | 1 | 0..many |
| R33 | USER_ACCOUNT | CLEARANCE | 1 | 0..many |
| R34 | USER_ACCOUNT | CLEARANCE | 0..1 | 0..many |
| R35 | LABORATORY | ITEM | 1 | 0..many |
| R36 | ITEM_CATEGORY | ITEM | 1 | 0..many |
| R37 | ITEM | STOCK_MOVEMENT | 1 | 0..many |
| R38 | USER_ACCOUNT | STOCK_MOVEMENT | 1 | 0..many |
| R39 | BORROWING_ITEM | STOCK_MOVEMENT | 0..1 | 0..many |
| R40 | RETURN_ENTRY | STOCK_MOVEMENT | 0..1 | 0..many |
| R41 | DISPOSAL | STOCK_MOVEMENT | 0..1 | 0..many |
| R42 | ITEM | DISPOSAL | 1 | 0..many |
| R43 | USER_ACCOUNT | DISPOSAL | 1 | 0..many |
| R44 | RETURN_ENTRY | DISPOSAL | 0..1 | 0..many |
| R45 | REQUEST_REVISION | USAGE_LOG | 1 | 0..many |
| R46 | BORROWING | USAGE_LOG | 0..1 | 0..many |
| R47 | USER_ACCOUNT | USAGE_LOG | 1 | 0..many |
| R48 | USER_ACCOUNT | USAGE_LOG | 1 | 0..many |
| R49 | LABORATORY | DAILY_TASK | 1 | 0..many |
| R50 | USER_ACCOUNT | DAILY_TASK | 1 | 0..many |
| R51 | USER_ACCOUNT | CHAT_EXCHANGE | 1 | 0..many |

| Independent Table | Cardinality |
|---|---|
| KNOWLEDGE_ARTICLE | No declared relationship |
