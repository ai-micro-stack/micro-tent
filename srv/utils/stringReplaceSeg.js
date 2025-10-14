function replaceContentBetweenTags(
  sourceString,
  startTag,
  stopTag,
  replacement
) {
  const regex = new RegExp(`${startTag}[\\s\\S]*?${stopTag}`, "gm");

  let updatedContent = "";
  if (sourceString.match(regex)) {
    updatedContent = sourceString.replace(
      regex,
      `${startTag}\n${replacement}\n${stopTag}`
    );
  } else {
    updatedContent =
      sourceString + `\n${startTag}\n${replacement}\n${stopTag}\n`;
  }

  return updatedContent;
}

module.exports = { replaceContentBetweenTags };
