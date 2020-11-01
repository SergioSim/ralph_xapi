export const eventNature = {
  // Should be the same as on server side!
  FIELD:    "Field",
  NESTED:   "Nested",
  DICT:     "Dict",
  LIST:     "List",
  STRING:   "String",
  UUID:     "UUID",
  INTEGER:  "Integer",
  BOOLEAN:  "Boolean",
  DATETIME: "DateTime",
  URL:      "Url",
  EMAIL:    "Email",
  IPV4:     "IPv4"
}

export const booleanNatures = [
  eventNature.IPV4,
  eventNature.URL,
  eventNature.INTEGER
];

export const notSpecialNatures = [
  eventNature.STRING,
  eventNature.UUID,
  eventNature.BOOLEAN,
  eventNature.DATETIME,
  eventNature.EMAIL
];