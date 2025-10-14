String.prototype.subs = function (start, length) {
  const S = this.toString();
  const size = S.length;
  let intStart = Number.isNaN(Number(start)) ? 0 : Number.parseInt(start);
  if (intStart === -Infinity) intStart = 0;
  else if (intStart < 0) intStart = Math.max(size + intStart, 0);
  else intStart = Math.min(intStart, size);
  let intLength =
    length === undefined
      ? size
      : Number.isNaN(Number(length))
      ? 0
      : Number.parseInt(length);
  intLength = Math.max(Math.min(intLength, size), 0);
  let intEnd = Math.min(intStart + intLength, size);
  return S.substring(intStart, intEnd);
};

function createUUID() {
  let s = [];
  let hexDigits = "0123456789abcdef";
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.subs(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4";
  s[19] = hexDigits.subs((s[19] & 0x3) | 0x8, 1);
  s[8] = s[13] = s[18] = s[23] = "-";

  let uuid = s.join("");
  return uuid;
}

module.exports = { createUUID };
