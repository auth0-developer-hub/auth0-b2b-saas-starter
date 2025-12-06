#!/bin/bash

# ==============================================================================
# Local Package Installation Script
# ==============================================================================
#
# This script builds and installs local versions of @auth0/myorganization-js
# and @auth0/web-ui-components packages into the auth0-b2b-saas-starter project.
#
# PREREQUISITES:
# - All three repositories must be in the same parent directory:
#   - auth0-b2b-saas-starter/
#   - auth0-ui-components/
#   - myorganization-js/
# - Node.js and pnpm must be installed
# - Run this script from the auth0-b2b-saas-starter directory
# - Package versions are read automatically from each package.json
#
# USAGE:
#   cd auth0-b2b-saas-starter
#   ./scripts/install-local-packages.sh
#
# WHAT IT DOES:
# 1. Builds myorganization-js package and copies tarball to dependencies
# 2. Builds core package with myorganization-js dependency
# 3. Builds react package with core dependency
# 4. Installs react package in saas-starter
# 5. Cleans up and restores all modified files (except saas-starter package.json)
#
# RESULT:
# - saas-starter package.json will reference the local react package
# - All tarballs will be available in saas-starter/dependencies/ directory
# - All other repositories return to their original state
#
# ==============================================================================

set -e

# Create dependencies folder in saas-starter
DEPENDENCIES_DIR="dependencies"
mkdir -p "$DEPENDENCIES_DIR"

# Relative paths from saas-starter
MYORG_PATH="../myorganization-js"
UI_COMPONENTS_PATH="../auth0-ui-components"
CORE_PATH="${UI_COMPONENTS_PATH}/packages/core"
REACT_PATH="${UI_COMPONENTS_PATH}/packages/react"

# Read package versions from package.json files
MYORG_VERSION=$(node -e "console.log(require('$MYORG_PATH/package.json').version)")
CORE_VERSION=$(node -e "console.log(require('$CORE_PATH/package.json').version)")
REACT_VERSION=$(node -e "console.log(require('$REACT_PATH/package.json').version)")

# Package names
MYORG_TARBALL="auth0-myorganization-js-${MYORG_VERSION}.tgz"
CORE_TARBALL="auth0-web-ui-components-core-${CORE_VERSION}.tgz"
REACT_TARBALL="auth0-web-ui-components-react-${REACT_VERSION}.tgz"

echo "================================"
echo "Building MyOrganization package"
echo "================================"

cd "$MYORG_PATH"
pnpm install
pnpm pack

# Backup package-lock if exists
if [ -f "package-lock.json" ]; then
  cp package-lock.json package-lock.json.backup
fi
if [ -f "pnpm-lock.yaml" ]; then
  cp pnpm-lock.yaml pnpm-lock.yaml.backup
fi

# Copy to destinations
cp "$MYORG_TARBALL" ../auth0-b2b-saas-starter/$DEPENDENCIES_DIR/
mv "$MYORG_TARBALL" "$CORE_PATH/"

echo ""
echo "================================"
echo "Building Core package"
echo "================================"

cd "$CORE_PATH"

# Backup package.json
cp package.json package.json.backup

# Backup lock files if they exist
if [ -f "package-lock.json" ]; then
  cp package-lock.json package-lock.json.backup
fi
if [ -f "pnpm-lock.yaml" ]; then
  cp pnpm-lock.yaml pnpm-lock.yaml.backup
fi

# Update package.json to include tarball in files and use file dependency
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (!pkg.files.includes('$MYORG_TARBALL')) {
  pkg.files.push('$MYORG_TARBALL');
}
pkg.dependencies['@auth0/myorganization-js'] = 'file:$MYORG_TARBALL';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

pnpm install --ignore-workspace
pnpm pack

# Copy to destinations
cp "$CORE_TARBALL" ../../../auth0-b2b-saas-starter/$DEPENDENCIES_DIR/
mv "$CORE_TARBALL" ../react/
mv "$MYORG_TARBALL" ../react/

echo ""
echo "================================"
echo "Building React package"
echo "================================"

cd ../react

# Backup package.json
cp package.json package.json.backup

# Backup lock files if they exist
if [ -f "package-lock.json" ]; then
  cp package-lock.json package-lock.json.backup
fi
if [ -f "pnpm-lock.yaml" ]; then
  cp pnpm-lock.yaml pnpm-lock.yaml.backup
fi

# Update package.json to include tarballs in files and use file dependencies
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (!pkg.files.includes('$CORE_TARBALL')) {
  pkg.files.push('$CORE_TARBALL');
}
if (!pkg.files.includes('$MYORG_TARBALL')) {
  pkg.files.push('$MYORG_TARBALL');
}
pkg.dependencies['@auth0/web-ui-components-core'] = 'file:$CORE_TARBALL';
pkg.dependencies['@auth0/myorganization-js'] = 'file:$MYORG_TARBALL';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

pnpm install --ignore-workspace
pnpm pack

# Move to saas-starter
mv "$REACT_TARBALL" ../../../auth0-b2b-saas-starter/$DEPENDENCIES_DIR/

echo ""
echo "================================"
echo "Installing in saas-starter"
echo "================================"

cd ../../../auth0-b2b-saas-starter

# Update package.json to use file dependency for React package
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.dependencies['@auth0/web-ui-components-react'] = 'file:$DEPENDENCIES_DIR/$REACT_TARBALL';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

npm install

echo ""
echo "================================"
echo "Cleanup - Restoring files"
echo "================================"

# Navigate to saas-starter first
SCRIPT_DIR="$PWD"

# Restore React
cd "$SCRIPT_DIR/$REACT_PATH"
if [ -f "package.json.backup" ]; then
  mv package.json.backup package.json
fi
if [ -f "package-lock.json.backup" ]; then
  mv package-lock.json.backup package-lock.json
fi
if [ -f "pnpm-lock.yaml.backup" ]; then
  mv pnpm-lock.yaml.backup pnpm-lock.yaml
else
  # If no backup exists, the file was created by pnpm install, remove it
  rm -f pnpm-lock.yaml
fi

# Restore Core
cd "$SCRIPT_DIR/$CORE_PATH"
if [ -f "package.json.backup" ]; then
  mv package.json.backup package.json
fi
if [ -f "package-lock.json.backup" ]; then
  mv package-lock.json.backup package-lock.json
fi
if [ -f "pnpm-lock.yaml.backup" ]; then
  mv pnpm-lock.yaml.backup pnpm-lock.yaml
else
  # If no backup exists, the file was created by pnpm install, remove it
  rm -f pnpm-lock.yaml
fi

# Restore MyOrganization
cd "$SCRIPT_DIR/$MYORG_PATH"
if [ -f "package-lock.json.backup" ]; then
  mv package-lock.json.backup package-lock.json
fi
if [ -f "pnpm-lock.yaml.backup" ]; then
  mv pnpm-lock.yaml.backup pnpm-lock.yaml
else
  # If no backup exists, the file was created by pnpm install, remove it
  rm -f pnpm-lock.yaml
fi

# Remove tarballs from non-saas-starter locations
rm -f "$MYORG_TARBALL"

cd "$SCRIPT_DIR/$CORE_PATH"
rm -f "$MYORG_TARBALL" "$CORE_TARBALL"

cd "$SCRIPT_DIR/$REACT_PATH"
rm -f "$MYORG_TARBALL" "$CORE_TARBALL" "$REACT_TARBALL"

echo ""
echo "================================"
echo "Done!"
echo "================================"
echo "Tarballs available in auth0-b2b-saas-starter/$DEPENDENCIES_DIR/:"
cd "$SCRIPT_DIR"
ls -lh $DEPENDENCIES_DIR/*.tgz
