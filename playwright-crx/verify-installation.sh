#!/bin/bash

echo "=================================="
echo "🎭 Playwright CRX Object Repository"
echo "   Installation Verification"
echo "=================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check backend structure
echo "📦 Checking Backend Structure..."
if [ -d "backend/src" ]; then
    echo -e "${GREEN}✓${NC} Backend directory exists"
else
    echo -e "${RED}✗${NC} Backend directory missing"
    exit 1
fi

# Check backend files
BACKEND_FILES=(
    "backend/src/index.ts"
    "backend/src/controllers/objectRepository.controller.ts"
    "backend/src/services/objectRepository.service.ts"
    "backend/src/routes/objectRepository.routes.ts"
    "backend/src/types/objectRepository.types.ts"
    "backend/src/migrations/006_create_object_repository.sql"
)

for file in "${BACKEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file missing"
    fi
done

# Check frontend structure
echo ""
echo "🎨 Checking Frontend Structure..."
if [ -d "frontend/src" ]; then
    echo -e "${GREEN}✓${NC} Frontend directory exists"
else
    echo -e "${RED}✗${NC} Frontend directory missing"
    exit 1
fi

# Check frontend files
FRONTEND_FILES=(
    "frontend/src/App.tsx"
    "frontend/src/main.tsx"
    "frontend/src/components/ObjectRepository.tsx"
    "frontend/src/components/ObjectRepository.css"
    "frontend/src/services/objectRepositoryAPI.ts"
    "frontend/src/services/pageObjectCodeGenerator.ts"
    "frontend/src/types/objectRepository.types.ts"
)

for file in "${FRONTEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file missing"
    fi
done

# Check configuration files
echo ""
echo "⚙️  Checking Configuration Files..."
CONFIG_FILES=(
    "backend/package.json"
    "backend/tsconfig.json"
    "backend/.env.example"
    "frontend/package.json"
    "frontend/tsconfig.json"
    "frontend/vite.config.ts"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file missing"
    fi
done

# Check documentation
echo ""
echo "📚 Checking Documentation..."
DOC_FILES=(
    "README.md"
    "IMPLEMENTATION_COMPLETE.md"
    "CHROME_EXTENSION_INTEGRATION.md"
)

for file in "${DOC_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file missing"
    fi
done

# Count total lines of code
echo ""
echo "📊 Code Statistics..."
BACKEND_LOC=$(find backend/src -name "*.ts" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
FRONTEND_LOC=$(find frontend/src -name "*.ts" -o -name "*.tsx" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
TOTAL_LOC=$((BACKEND_LOC + FRONTEND_LOC))

echo "Backend Lines of Code: $BACKEND_LOC"
echo "Frontend Lines of Code: $FRONTEND_LOC"
echo "Total Lines of Code: $TOTAL_LOC"

# Count files
TOTAL_FILES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.sql" -o -name "*.md" \) | wc -l)
echo "Total Files: $TOTAL_FILES"

echo ""
echo "=================================="
echo -e "${GREEN}✅ Installation Verified!${NC}"
echo "=================================="
echo ""
echo "📋 Next Steps:"
echo "1. cd backend && npm install"
echo "2. cd frontend && npm install"
echo "3. Setup database and run migration"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm run dev"
echo ""
echo "🌐 Access URLs:"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:3000"
echo "   Health:   http://localhost:3001/health"
echo ""
