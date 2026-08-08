from typing import List, Dict, Any

def evaluate_data_quality(transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    total = len(transactions)
    if total == 0:
        return {
            "validCount": 0,
            "invalidCount": 0,
            "missingValueRate": 0.0,
            "duplicateRate": 0.0,
            "schemaErrorCount": 0,
            "unexpectedCategoriesCount": 0,
            "qualityScore": 100.0,
            "issues": {"message": "No transactions in sample window"}
        }

    valid_count = 0
    invalid_count = 0
    missing_fields_count = 0
    schema_errors = 0
    unexpected_categories = 0
    seen_ids = set()
    duplicates = 0

    known_categories = {"FOOD_AND_DINING", "SHOPPING", "TRAVEL_AND_TRANSPORT", "UTILITIES_AND_BILLS", "ENTERTAINMENT", "FINANCIAL_SERVICES", "HEALTH_AND_WELLNESS", "OTHERS"}

    for tx in transactions:
        tx_id = tx.get("id") or tx.get("transactionId")
        if tx_id:
            if tx_id in seen_ids:
                duplicates += 1
            else:
                seen_ids.add(tx_id)

        amount = tx.get("amount")
        country = tx.get("country")
        category = tx.get("category") or tx.get("merchantCategory")

        is_valid = True
        if amount is None or not isinstance(amount, (int, float)) or amount <= 0:
            is_valid = False
            missing_fields_count += 1
        
        if country and not isinstance(country, str):
            schema_errors += 1
            is_valid = False

        if category and category not in known_categories:
            unexpected_categories += 1

        if is_valid:
            valid_count += 1
        else:
            invalid_count += 1

    missing_rate = round(missing_fields_count / total, 4)
    duplicate_rate = round(duplicates / total, 4)
    
    # Calculate Quality Score 0 - 100
    penalty = (missing_rate * 40) + (duplicate_rate * 30) + (min(1.0, schema_errors / total) * 20)
    quality_score = max(0.0, round(100.0 - penalty, 1))

    return {
        "validCount": valid_count,
        "invalidCount": invalid_count,
        "missingValueRate": missing_rate,
        "duplicateRate": duplicate_rate,
        "schemaErrorCount": schema_errors,
        "unexpectedCategoriesCount": unexpected_categories,
        "qualityScore": quality_score,
        "issues": {
            "missingFields": missing_fields_count,
            "duplicates": duplicates,
            "schemaErrors": schema_errors,
            "unexpectedCategories": unexpected_categories
        }
    }
