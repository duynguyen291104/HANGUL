#!/bin/bash

echo "🧪 Testing Learning Path API..."
echo ""

# Get token first
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password123"}')

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Got token"
echo ""

# Call learning path endpoint
echo "📍 Calling GET /api/user/learning-path with token..."
RESPONSE=$(curl -s -X GET http://localhost:5000/api/user/learning-path \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

# Pretty print
echo $RESPONSE | python3 -m json.tool | head -100

# Count topics
TOPIC_COUNT=$(echo $RESPONSE | grep -o '"totalTopics":[0-9]*' | cut -d':' -f2)
echo ""
echo "📊 Total Topics Returned: $TOPIC_COUNT"
