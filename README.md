# 🧾 Transaction Reconciliation Engine

🚀 **Live API:**  
https://reconciliation-engine-42pe.onrender.com/

👉 All endpoints are accessible by appending `/api/...`

---

## 📌 Problem Statement

Users and exchanges often report the same transactions differently due to:

- Timestamp differences  
- Rounding errors in quantity  
- Different naming conventions (BTC vs Bitcoin)  
- Opposite perspectives (TRANSFER_IN vs TRANSFER_OUT)  
- Missing or malformed data  

This system reconciles both datasets and produces a structured report.

---

## 🏗️ System Architecture

```
CSV → Ingestion → Validation → Normalization → MongoDB  
→ Matching Engine → Reconciliation Report → API
```

---

## ⚙️ Core Components

---

### 🔹 1. Data Ingestion

- Reads CSV files (user + exchange)
- Stores each row in DB
- Keeps:
  - `raw` (original data)
  - `normalized` (cleaned data)
  - `validation` (errors/warnings)

---

### 🔹 2. Data Validation (Cleaning Logic)

Each row is validated:

| Check | Example |
|------|--------|
| Missing fields | timestamp missing |
| Invalid timestamp | malformed date |
| Negative quantity | -0.1 BTC |
| Invalid type | unknown type |

---

### ❗ Important

- ❌ No row is dropped  
- ✅ Invalid rows are stored with error reasons  

---

### 🔹 3. Data Normalization

#### Asset Normalization

```
BTC, bitcoin → BTC
ETH, ethereum → ETH
```

---

#### Type Normalization

```
TRANSFER_IN  → TRANSFER + IN
TRANSFER_OUT → TRANSFER + OUT
```

---

#### Numeric Parsing

```
"0.5" → 0.5
"62000.00" → 62000
```

---

### 🔹 Why Normalization?

```
Raw data is inconsistent → normalization makes it comparable
```

---

## 🔥 4. Matching Engine (CORE LOGIC)

---

### 🎯 Goal

Match each **user transaction** with **exchange transaction**

---

### 🧠 Matching Steps

1. **Filter by Asset**
2. **Filter by Type**
   - BUY ↔ BUY  
   - SELL ↔ SELL  
   - TRANSFER_OUT ↔ TRANSFER_IN  
3. **Apply Timestamp Tolerance**
4. **Select Best Match**
   - Minimum time difference  
   - Then minimum quantity difference  
5. **Categorize**

---

### 📊 Categories

| Category | Meaning |
|--------|--------|
| MATCHED | Within tolerance |
| CONFLICTING | Exists but differs beyond tolerance |
| UNMATCHED_USER | Only in user |
| UNMATCHED_EXCHANGE | Only in exchange |

---

### 🔍 Explainable Results

```
Quantity differs by 0.12% which exceeds tolerance (0.01%)
Price mismatch: user=3500, exchange=3520
Fee mismatch: user=0.0015, exchange=0.002
```

---

## ⚙️ Configuration

Supports:

- API input  
- Environment variables  
- Default fallback  

---

## 🚀 API Endpoints

---


### 1️⃣ Run Reconciliation

**POST** `/api/reconcile`

#### Request Body

```json
{
  "TIMESTAMP_TOLERANCE_SECONDS": 300,
  "QUANTITY_TOLERANCE_PCT": 0.01
}
```

#### Response

```json
{
  "runId": "abc-123",
  "summary": {
    "matched": 20,
    "conflicting": 2,
    "unmatchedUser": 1,
    "unmatchedExchange": 2
  }
}
```

---

### 2️⃣ Full Report

**GET** `/api/report/:runId`

---

### 3️⃣ Summary

**GET** `/api/report/:runId/summary`

---

### 4️⃣ Unmatched Records

**GET** `/api/report/:runId/unmatched`

---

### 5️⃣ Invalid Rows

**GET** `/api/report/:runId/invalid`

---

### 6️⃣ CSV Export (NEW)

**GET** `/api/report/:runId/csv`

---


## 🗄️ Database Design

---

### Transaction Collection

- raw  
- normalized  
- validation  

---

### Reconciliation Collection

- runId  
- config  
- summary  
- results  

---

## ⚡ Performance Optimization

---

### ❌ Naive

```
O(N × M)
```

---

### ✅ Optimized

- Indexed on:

```
(asset, type, timestamp)
```

---

### Complexity

```
≈ O(N log M)
```

---

## ⚠️ Edge Cases Handled

- Duplicate IDs  
- Missing timestamps  
- Invalid timestamps  
- Negative quantities  
- Asset aliasing  
- Transfer direction mismatch  
- Rounding issues  

---

## 🛠️ Tech Stack

- Node.js  
- Express.js  
- MongoDB  

---

## ▶️ Setup

```bash
npm install
```

Create `.env`:

```
MONGO_URI=your_mongodb_connection_string
```

Run:

```bash
node server.js
```

---

## 🎯 Final Thoughts

Designed for:

- Messy real-world data  
- Financial accuracy  
- Auditability  
- Scalability  

---

## 👤 Author

Rushi Danidhariya