const { queries, mutations, customObjects } = require('./typeFactory');
const {
  collectQueries,
  collectMutations,
  collectCustomObjectRelationships,
} = require('./resolverFactory');
const { isJunctionTable } = require('./helpers/helperFunctions');
const { pascalCase } = require('pascal-case');
const { singular } = require('pluralize');
/*    High level functions tasked with assembling the Types and the Resolvers */
schemaFactory = {};
/*  Creates query, mutation, and custom Object Types  */
schemaFactory.createTypes = (sqlSchema) => {
  let queryType = '';
  let mutationType = '';
  let customObjectType = '';

  for (const tableName of Object.keys(sqlSchema)) {
    const tableData = sqlSchema[tableName];
    const { foreignKeys, columns } = tableData;
    if (!isJunctionTable(foreignKeys, columns)) {
      queryType += queries(tableName, tableData);
      mutationType += mutations(tableName, tableData);
      customObjectType += customObjects(tableName, sqlSchema);
    }
  }

  const types =
    `${'const typeDefs = `\n' + '  type Query {\n'}${queryType}  }\n\n` +
    `  type Mutation {${mutationType}  }\n\n` +
    `${customObjectType}\`;\n\n`;

  const typeDefs =
    `${'  type Query {\n'}${queryType}  }\n\n` +
    `  type Mutation {${mutationType}  }\n\n` +
    `${customObjectType}`;

  return { types, typeDefs };
};

schemaFactory.createResolvers = (sqlSchema) => {
  let queryResolvers = '';
  let mutationResolvers = '';
  let customObjectTypeResolvers = '';

  // initialize resolversObject for makeExecutableSchema to generate GraphiQL playground
  const resolversObject = {};
  resolversObject.Query = {};
  resolversObject.Mutations = {};

  for (const tableName of Object.keys(sqlSchema)) {
    const tableData = sqlSchema[tableName];
    const { foreignKeys, columns } = tableData;
    if (!isJunctionTable(foreignKeys, columns)) {
      if (sqlSchema[tableName].referencedBy) {
        const resolverName = pascalCase(singular(tableName));
        resolversObject[resolverName] = {};
      }
    }
  }

  for (const tableName of Object.keys(sqlSchema)) {
    const tableData = sqlSchema[tableName];
    const { foreignKeys, columns } = tableData;
    if (!isJunctionTable(foreignKeys, columns)) {
      queryResolvers += collectQueries(tableName, tableData, resolversObject);
      mutationResolvers += collectMutations(
        tableName,
        tableData,
        resolversObject
      );
      customObjectTypeResolvers += collectCustomObjectRelationships(
        tableName,
        sqlSchema,
        resolversObject
      );
    }
  }
  const resolvers =
    '\nconst resolvers = {\n' +
    '  Query: {' +
    `    ${queryResolvers}\n` +
    '  },\n\n' +
    '  Mutation: {\n' +
    `    ${mutationResolvers}\n` +
    '  },\n' +
    `    ${customObjectTypeResolvers}\n  }\n`;

  return { resolvers, resolversObject };
};

module.exports = schemaFactory;
