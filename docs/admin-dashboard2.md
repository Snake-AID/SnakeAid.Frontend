| Endpoint | Mô tả | Params chính |
|----------|--------|-------------|
| `GET /api/admin/analytics/users` | Quản lý User | `period`, `from`, `to` |
| `GET /api/admin/analytics/cases` | Quản lý tổng case snakebite + snake catching | `period`, `from`, `to` |

NOTE: `period`: day, month, year

reponse `GET /api/admin/analytics/users`
 "data": {
    "from": "2026-03-01",
    "to": "2026-05-01",
    "period": "month",
    "totalUsers": 13,
    "timeline": [
      {
        "label": "2026-03",
        "totalUsers": 13
      },
      {
        "label": "2026-04",
        "totalUsers": 0
      },
      {
        "label": "2026-05",
        "totalUsers": 0
      }
    ]
  },

  reponse `/api/admin/analytics/cases`
  "data": {
    "from": "2026-03-01",
    "to": "2026-05-01",
    "period": "month",
    "totalCases": 59,
    "snakebiteCases": 56,
    "snakeCatchingCases": 3,
    "timeline": [
      {
        "label": "2026-03",
        "totalCases": 45,
        "snakebiteCases": 45,
        "snakeCatchingCases": 0
      },
      {
        "label": "2026-04",
        "totalCases": 14,
        "snakebiteCases": 11,
        "snakeCatchingCases": 3
      },
      {
        "label": "2026-05",
        "totalCases": 0,
        "snakebiteCases": 0,
        "snakeCatchingCases": 0
      }
    ]