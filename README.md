# 🧾 Transaction Reconciliation Engine

A production-grade backend system that reconciles crypto transactions between user-reported data and exchange data.

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

Example:

```json
{
  "transaction_id": "USR-018",
  "errors": ["INVALID_TIMESTAMP"]
}
```

---

### 🔹 3. Data Normalization

We standardize messy data:

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

Because raw data is inconsistent:

```
BTC ≠ bitcoin ❌
TRANSFER_IN ≠ TRANSFER_OUT ❌
```

After normalization:

```
Everything becomes comparable ✅
```

---

## 🔥 4. Matching Engine (CORE LOGIC)

---

### 🎯 Goal

Match each **user transaction** with **exchange transaction**

---

## 🧠 Step-by-Step Matching

---

### STEP 1: Filter by Asset

```
BTC ↔ BTC
ETH ↔ ETH
```

---

### STEP 2: Filter by Type

| User | Exchange | Match |
|------|--------|------|
| BUY | BUY | ✅ |
| SELL | SELL | ✅ |
| TRANSFER_OUT | TRANSFER_IN | ✅ |

---

### STEP 3: Timestamp Tolerance

```
user_time ± tolerance (default 300 sec)
```

Example:

```
10:00:00 → range: 09:55:00 to 10:05:00
```

---

### STEP 4: Choose Best Match

Among candidates:

- Minimum time difference  
- Then minimum quantity difference  

---

### STEP 5: Categorization

---

#### ✅ MATCHED

```
Within tolerance
```

---

#### ⚠️ CONFLICTING

```
Exists but differs beyond tolerance
```

Example:

```
Quantity differs by 0.12% which exceeds tolerance (0.01%)
Price mismatch: user=3500, exchange=3520
Fee mismatch: user=0.0015, exchange=0.002
```

---

#### ❌ UNMATCHED_USER

```
No exchange transaction found
```

---

#### ❌ UNMATCHED_EXCHANGE

```
No user transaction found
```

---

## 🔍 Explainable Matching

Each result includes reason:

```json
{
  "category": "CONFLICTING",
  "reason": "Quantity differs by 0.12% which exceeds tolerance (0.01%)"
}
```

👉 This ensures auditability (important in fintech)

---

## ⚙️ Configuration

Supports **multi-layer config**

| Priority | Source |
|--------|--------|
| 1 | API body |
| 2 | ENV |
| 3 | Default |

---

Example:

```json
{
  "TIMESTAMP_TOLERANCE_SECONDS": 300,
  "QUANTITY_TOLERANCE_PCT": 0.01
}
```

---

## 🚀 API Endpoints

---

### 1️⃣ Run Reconciliation

```
POST /api/reconcile

Body:
{
  "TIMESTAMP_TOLERANCE_SECONDS": 300,
  "QUANTITY_TOLERANCE_PCT": 0.01
}

```

Response:

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

```
GET /api/report/:runId
```

---

### 3️⃣ Summary

```
GET /api/report/:runId/summary
```

---

### 4️⃣ Unmatched

```
GET /api/report/:runId/unmatched
```

---

### 5️⃣ Invalid Rows

```
GET /api/report/:runId/invalid
```

---

## 🗄️ Database Design

---

### Transaction Collection

- raw → original CSV row  
- normalized → cleaned row  
- validation → errors  

---

### Reconciliation Collection

- runId  
- config  
- summary  
- results  

---

## ⚡ Performance Optimization

---

### ❌ Naive Approach

```
Compare every user with every exchange
→ O(N × M)
```

---

### ✅ Optimized Approach

- Compound index:

```
(asset, type, timestamp)
```

---

### Matching Process:

1. Filter by asset + type  
2. Apply timestamp window  
3. Search only relevant subset  

---

### Complexity:

```
≈ O(N log M)
```

---

### 🚀 Impact

| Approach | Operations |
|--------|----------|
| Naive | 1e7 checks |
| Optimized | ~100–1000 checks |

---

## ⚠️ Edge Cases Handled

- Duplicate transaction IDs  
- Missing timestamps  
- Invalid timestamps  
- Negative quantities  
- Asset aliasing  
- Transfer direction mismatch  
- Rounding differences  

---

## 🧠 Key Design Decisions

- Store raw + normalized data (auditability)  
- Use tolerance-based matching  
- Use compound indexing for scale  
- Use flexible schema for messy data  
- Provide explainable results  

---

## 🛠️ Tech Stack

- Node.js  
- Express.js  
- MongoDB (Mongoose)  
- CSV Parser  

---

## ▶️ Setup

```bash
npm install
```

Create `.env`:

```
MONGO_URI=mongodb://127.0.0.1:27017/reconciliation_db
```

Run:

```bash
node server.js
```

---

## 🎯 Final Thoughts

This system is designed for **real-world financial data challenges**:

- Messy data  
- Inconsistent formats  
- Audit requirements  
- Scalability  

It demonstrates:

- Strong backend engineering  
- Data processing pipelines  
- Matching algorithms  
- Production-level thinking  

---

## 👤 Author

Rushi Danidhariya