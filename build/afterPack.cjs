const { execSync } = require('child_process');

exports.default = async function (context) {
    if (context.electronPlatformName === 'darwin') {
        const appOutDir = context.appOutDir;
        const appName = context.packager.appInfo.productFilename;
        const appPath = `${appOutDir}/${appName}.app`;
        try {
            execSync(`xattr -cr "${appPath}"`);
            console.log(`Successfully removed Extended Attributes from ${appPath}`);
        } catch (e) {
            console.error(`Failed to remove Extended Attributes: ${e}`);
        }
    }
};
