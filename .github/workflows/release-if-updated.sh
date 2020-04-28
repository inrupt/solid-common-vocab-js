# This script expects the path to the module directory as an argument.
cd $1
# Get the package name from the package.json file.
packageName=`node -p "require('./package.json').name"`
publishedVersion=`npm view $packageName --registry https://npm.pkg.github.com version `
newVersion=`node -p "require('./package.json').version"`
# Only proceed if the version about to be published has not been published previously.
if [ $newVersion != $publishedVersion ]
then
    npm install --registry https://npm.pkg.github.com/inrupt
    npm test
    npm publish --registry https://npm.pkg.github.com/inrupt
fi
