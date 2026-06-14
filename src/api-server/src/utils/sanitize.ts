import xss, { IWhiteList } from "xss";

const whiteList: IWhiteList = {
  p: [],
  br: [],
  strong: [],
  em: [],
  ul: [],
  ol: [],
  li: [],
};

export const sanitizeHtml = (html: string) =>
  xss(html, {
    whiteList,
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script"],
  });
