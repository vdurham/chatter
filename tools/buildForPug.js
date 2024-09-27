/* 
This should be used as a post-build step after Parcel has built the client 
to add the Pug files back to the distribution directory and update them with proper 
script and link tags that refer to compiled versions in the distribution 
directory. These are the steps:

1. Figure out where Parcel put the compiled versions of .css files and client-side
   .ts scripts in the distribution directory.
2. Replace in each Pug file the references to the .ts scripts and .css files by 
   their compiled pathnames in the distribution directory. 
3. Copy each Pug file to the proper subfolder in the distribution directory. 
4. Handle the included Pug files in such a way that script and link tags are removed, and 
   instead copied to the top-level Pug file by steps 1-3, but everything else is retained.

This way Pug files can be referred to in the server code and be rendered dynamically
with res.render(...)! 

Caution: This Pug workaround for Parcel is fragile. It is not perfect and may not work in 
all cases. 
- It assumes all top-level Pug sources are stored in the client/views directory.
- Any Pug sources included in the the top-level Pug files are stored in the 
  client/views/includes directory.
- It handles only script and link tags that refer to .ts and .css files, respectively. 
  These files need to be loaded in the head section. 
- The workaround will not work without adaptation for other tags or loaded files with 
  other extensions, including .js. 
- It works with current Parcel configuration and settings that compile stylesheets
  into .css and TS scripts into .js in a specific way. 
- Parcel client-side targets must be specified in the package.json file, and should include
  all the top-level Pug files, but not the included Pug files.
*/

const fs = require('fs');
const path = require('path');

// Define the directories: change these if your app has a different build structure.
// Source Pug directory where original Pug files are located.
const pugSource = 'client/views';
const pugSourceIncludes = 'client/views/includes';
const distDir = '.dist';
const pugTarget = distDir + '/' + pugSource;
const pugTargetIncludes = distDir + '/' + pugSourceIncludes;
const pugSourceDir = path.join(__dirname, '..', pugSource);
const pugSourceIncludesDir = path.join(__dirname, '..', pugSourceIncludes);
// Pug subfolder in the distibution directory where compiled Pug files should be placed.
// Should normally parallel the source Pug directory in the distribution directory.
const pugTargetDir = path.join(__dirname, '..', pugTarget);
const pugTargetIncludesDir = path.join(__dirname, '..', pugTargetIncludes);
console.log('Pug source directory: ' + pugSourceDir);
console.log('Pug output directory: ' + pugTargetDir);
console.log('Pug source includes directory: ' + pugSourceIncludesDir);
console.log('Pug output includes directory: ' + pugTargetIncludesDir);
/*
 Helper functions to extract the correct file references from the compiled HTML 
 file after Parcel has compiled them: these are the file references that were 
 copied by Parcel to the distribution directory.
*/

// Get all the matches for a given regex for a given group
function getMatches(regex, content, group = 1) {
  let match;
  let matches = [];
  while ((match = regex.exec(content)) !== null) {
    // Get the second group of the match
    matches.push(match[group]);
  }
  return matches;
}

/* 
   Function to extract the file references from the compiled HTML file in the 
   distribution directory.
*/
function extractFileRefsFromCompiledHTML(
  htmlFileName,
  buildDir = pugTargetDir
) {
  const htmlFilePath = path.join(buildDir, `${htmlFileName}.html`);
  let htmlContent;
  try {
    htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    const cssRegex = /<link\s+(.*?href\s*=\s*["'][^"^']*\.css["'].*?)>/g;
    const jsRegex = /<script\s+(.*?src\s*=\s*["']([^"]*\.js)["'].*?)>/g;

    return {
      css: getMatches(cssRegex, htmlContent),
      js: getMatches(jsRegex, htmlContent)
    };
  } catch (err) {
    console.error(`-- Compiled HTML file not found for ${htmlFileName}.html`);
    console.error(
      `   Make sure this file is a specified client target in package.json!`
    );
    return;
  }
}

/* This function looks for the compiled file reference in the original Pug file.
   Search is based on the file name, but it succeeds only if Parcel 
   retains the original file names and just adds a alphanumeric extension
   to them. However sometimes this is not the case due to the bundling
   process and sometimes compiled scripts are refactored and shared by
   multiple pages. Not used for now since it's not reliable.
*/
function findOriginalRef(pugContent, fileReference, tag) {
  let ext, ref;
  if (tag === 'script') {
    ext = 'js';
    ref = 'src';
  } else if (tag === 'link') {
    ext = 'css';
    ref = 'href';
  }
  const originalRefRegexString =
    ref + '\\s*=\\s*["\'].+/(.+)(\\.[a-z0-9]+)\\.' + ext + '["\']';
  const originalRefRegex = new RegExp(originalRefRegexString);
  const match = originalRefRegex.exec(fileReference);
  if (match) {
    const refRegEx = new RegExp(match[1] + '.' + 'ts');
    return pugContent.match(refRegEx);
  }
  return false;
}

/*
  Function to remove the script and link tags in the Pug content.
*/
function removeTagsFromPugContent(pugContent, options) {
  const { tag, regex, indentStr } = options;
  console.log(`-- Removing ${tag} tags from included file!`);
  let match;
  let matches = [];
  // Find the matches first to print them on console.
  while ((match = regex.exec(pugContent)) !== null) {
    // Get the second group of the match
    matches.push(match[0]);
  }
  if (matches.length === 0) {
    console.log(`-- No ${tag} tags found to be removed!`);
  } else {
    pugContent = pugContent.replace(regex, '');
    console.log(`-- Removed these ${tag} tags from included file...`);
    matches.forEach((match) => {
      console.log('   >> ' + match);
    });
  }
  return pugContent;
}

/* 
  Function to replace the script and link tags in the Pug content by
  the references to the compiled files in the distribution directory. 
*/
function replaceTagsInPugContent(pugContent, refs, options) {
  const { tag, indentStr, markerText, regex } = options;
  if (refs.length > 0) {
    const markerRegexGlobal = new RegExp(indentStr + markerText + '\n', 'g');
    const markerRegexFirstMatch = new RegExp(markerText);
    console.log(`-- ${refs.length} ${tag} tag(s) found to fix!`);
    // Replace the link tags with the marker text
    pugContent = pugContent.replace(regex, markerText);
    // Compose the compiled link tags as one unit, with right indentation.
    let tags = '';
    // Walk through the file references and add them to the replacement string.
    for (let i = 0; i < refs.length; i++) {
      const fileRef = refs[i];
      // if (!findOriginalRef(origPugContent, fileRef, tag)) continue; // not used, unreliable
      tags = tags + tag + '(' + fileRef + ')';
      if (i < refs.length - 1) tags = tags + '\n' + indentStr;
    }
    console.log('-- Fixed ' + tag + ' tags as follows...');
    if (markerRegexFirstMatch.test(pugContent)) {
      console.log('-- Replacing...');
      // Replace the first marker text with the compiled link tags.
      pugContent = pugContent.replace(markerRegexFirstMatch, tags);
      // Replace the remaining marker text with nothing, removing the tags.
      pugContent = pugContent.replace(markerRegexGlobal, '');
    } else {
      console.log('-- Adding...');
      // Add the tags after the include section with right indentation
      const includeRegex = /(include.+)$/m;
      pugContent = pugContent.replace(includeRegex, `\$1\n${indentStr + tags}`);
    }
    console.log(indentStr + tags);
  } else {
    console.log('-- No ' + tag + ' tags found to fix!');
  }
  return pugContent;
}

/* 
  Function to fix the Pug content by replacing the references in script and 
  link tags in the content by the references to the compiled files in the 
  distribution directory if replace option is true. If replace option is false,
  then it removes the tags from the included file.
*/
function fixPugContent(pugContent, options) {
  // The tag option is either 'link' or 'script'.
  const { tag, refs, replace, markerText, indentStr } = options;
  const tagRegex = new RegExp(tag + '\\(.*?\\)', 'g');
  if (!replace)
    return removeTagsFromPugContent(pugContent, {
      tag: tag,
      regex: tagRegex,
      indentStr: indentStr
    });
  return replaceTagsInPugContent(pugContent, refs, {
    tag: tag,
    indentStr: indentStr,
    markerText: markerText,
    regex: tagRegex
  });
}

function processTopLevelPugFiles() {
  let pugFiles;
  try {
    pugFiles = fs
      .readdirSync(pugSourceDir)
      .filter((file) => file.endsWith('.pug'));
  } catch (err) {
    console.error('Pug source directory ' + pugSourceDir + ' not found!');
    return;
  }
  pugFiles.forEach((pugFileName) => {
    console.log('Processing top-level ' + pugFileName + '...');
    const fileReferences = extractFileRefsFromCompiledHTML(
      pugFileName.replace('.pug', ''),
      pugTargetDir
    );
    if (fileReferences) {
      const pugFilePath = path.join(pugSourceDir, pugFileName);
      // Copy the updated Pug file to the distribution directory.
      const outputFilePath = path.join(pugTargetDir, pugFileName);
      fs.copyFileSync(pugFilePath, outputFilePath);
      let pugContent = fs.readFileSync(outputFilePath, 'utf8');
      // Regex for the first-level indentation string in a Pug file.
      let indentRegex = /^[\s\t]+/m;
      // First-level indentation string in a Pug file.
      const match = pugContent.match(indentRegex);
      const level1Indent = match ? match[0] : '';
      // Define a marker text for tags to be replaced.
      const markerText = 'XXXXXXXX';
      /* 
        Fix the Pug content by replacing the references in script and link tags
        in the Pug content with the references to the compiled files in the 
        distribution directory.
      */
      pugContent = fixPugContent(pugContent, {
        tag: 'link',
        refs: fileReferences.css,
        replace: true,
        markerText: markerText,
        indentStr: level1Indent
      });
      pugContent = fixPugContent(pugContent, {
        tag: 'script',
        refs: fileReferences.js,
        replace: true,
        markerText: markerText,
        indentStr: level1Indent
      });

      // Write the updated Pug content to the distribution directory.
      fs.writeFileSync(outputFilePath, pugContent, 'utf8');
      console.log('-- Updated ' + pugTarget + '/' + pugFileName);
    } else {
      console.error(
        `-- Compiled .js & .css files not found for ${pugFileName}`
      );
      console.error(
        `   Make sure you have run 'npm build' to have Parcel to compile them!`
      );
    }
  });
  console.log('Top-level Pug templates updated and copied to ' + pugTargetDir);
}

function processIncludedPugFiles() {
  let pugFiles;
  try {
    pugFiles = fs
      .readdirSync(pugSourceIncludesDir)
      .filter((file) => file.endsWith('.pug'));
  } catch (err) {
    console.log(
      'Pug includes directory ' + pugSourceIncludesDir + ' not found!'
    );
    console.log('Skipping processing of included files!');
    return;
  }
  if (!fs.existsSync(pugTargetIncludesDir)) {
    try {
      fs.mkdirSync(pugTargetIncludesDir, { recursive: true });
      console.log('Pug includes folder created in the distribution directory!');
    } catch (error) {
      console.error(
        'Pug includes folder could not be created in the distribution directory!'
      );
    }
  } else {
    console.log(
      'Pug includes folder already exists in the distribution directory!'
    );
  }
  pugFiles.forEach((pugFileName) => {
    console.log('Processing included ' + pugFileName + '...');
    const pugFilePath = path.join(pugSourceIncludesDir, pugFileName);
    // Copy the updated Pug file to the distribution directory.
    const outputFilePath = path.join(pugTargetIncludesDir, pugFileName);
    fs.copyFileSync(pugFilePath, outputFilePath);
    let pugContent = fs.readFileSync(outputFilePath, 'utf8');
    // Regex for the first-level indentation string in a Pug file.
    let indentRegex = /^[\s\t]+/m;
    // First-level indentation string in a Pug file.
    const match = pugContent.match(indentRegex);
    const level1Indent = match ? match[0] : '';
    // Define a marker text for tags to be replaced.
    pugContent = fixPugContent(pugContent, {
      tag: 'link',
      replace: false,
      indentStr: level1Indent
    });
    pugContent = fixPugContent(pugContent, {
      tag: 'script',
      replace: false,
      indentStr: level1Indent
    });
    // Write the updated Pug content to the distribution directory.
    fs.writeFileSync(outputFilePath, pugContent, 'utf8');
    console.log('-- Updated ' + pugTargetIncludes + '/' + pugFileName);
  });
  console.log(
    'Included Pug templates updated and copied to ' + pugTargetIncludesDir
  );
}

processTopLevelPugFiles();

processIncludedPugFiles();
