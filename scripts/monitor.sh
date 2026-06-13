#!/bin/bash

check() {
  local name=$1
  local url=$2
  if curl -sf "$url" > /dev/null; then
    echo "✅ $name OK"
  else
    echo "❌ $name FALHOU ($url)"
  fi
}

echo "🔍 Health checks..."
check "API"      "http://localhost:5003/api/health"
check "Web"      "http://localhost:5002/api/health"
check "Site"     "http://localhost:5000/api/health"
check "Landing"  "http://localhost:5001/"
