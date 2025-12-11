import _ from "lodash";

export function paginate(items, pageNumber, pageSize) {
  const startIndex = (pageNumber - 1) * pageSize;
  // _.slice(items, startIndex)
  // _.take()
  //in order to use like chain of loadash function we need to convert items into lodash wrapper data
  return _(items).slice(startIndex).take(pageSize).value();
  //at the end .value converted back to items
}
