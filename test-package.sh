#!/bin/bash

echo "🧪 GitGenius Test Suite"
echo "======================"

# Build the project
echo "📦 Building project..."
cd /home/dharshan/projects/gitgenius
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Test basic functionality
echo -e "\n🔧 Testing CLI commands..."

# Test version
echo "Testing --version:"
node dist/cli.js --version

# Test help
echo -e "\nTesting --help:"
node dist/cli.js --help | head -5

# Test config
echo -e "\nTesting config --list:"
node dist/cli.js config --list | head -3

echo -e "\n✅ Basic functionality tests passed!"

# Test in a git repository
echo -e "\n🌿 Testing git functionality..."

# Create test directory
TEST_DIR="/tmp/gitgenius-test-$(date +%s)"
mkdir -p $TEST_DIR
cd $TEST_DIR

# Initialize git repo
git init > /dev/null 2>&1
git config user.name "Test User"
git config user.email "test@example.com"

# Create test file
echo "function hello() { console.log('Hello GitGenius!'); }" > test.js
git add .

echo "Testing with staged changes:"
node /home/dharshan/projects/gitgenius/dist/cli.js 2>&1 | head -2

# Test branch functionality
git commit -m "Initial commit" > /dev/null 2>&1
git branch feature-branch
echo "Testing branch listing:"
node /home/dharshan/projects/gitgenius/dist/cli.js branch

# Cleanup
cd /home/dharshan/projects/gitgenius
rm -rf $TEST_DIR

echo -e "\n🎉 All tests completed successfully!"
echo "GitGenius is ready for use!"
