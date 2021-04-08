const { pascalCase } = require('pascal-case');
const { singular } = require('pluralize');
const resolverHelper = require('./helpers/resolverHelpers');
const resolverFactory = {};

resolverFactory.collectQueries = (tableName, tableData, resolversObject) => {
  const { primaryKey } = tableData;
  const queryByPK = resolverHelper.queryByPrimaryKey(
    tableName,
    primaryKey,
    resolversObject
  );
  const queryAll = resolverHelper.queryAll(tableName, resolversObject);
  return `\n${queryByPK}\n${queryAll}`;
};
/* -------------------------------- */
resolverFactory.collectMutations = (tableName, tableData, resolversObject) => {
  const { primaryKey, columns } = tableData;
  const createMutation = resolverHelper.createMutation(
    tableName,
    primaryKey,
    columns,
    resolversObject
  );
  const updateMutation = resolverHelper.updateMutation(
    tableName,
    primaryKey,
    columns,
    resolversObject
  );
  const deleteMutation = resolverHelper.deleteMutation(
    tableName,
    primaryKey,
    resolversObject
  );
  return `${createMutation}\n${updateMutation}\n${deleteMutation}\n`;
};
/* ------------------------------------ */
resolverFactory.collectCustomObjectRelationships = (
  tableName,
  sqlSchema,
  resolversObject
) => {
  if (!sqlSchema[tableName].referencedBy) return '';
  const resolverName = pascalCase(singular(tableName));
  const resolverBody = resolverHelper.identifyRelationships(
    tableName,
    sqlSchema,
    resolversObject
  );

  return `
    ${resolverName}: {
      ${resolverBody}
    }, \n`;
};

module.exports = resolverFactory;
