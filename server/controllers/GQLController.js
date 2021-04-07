const { createTypes, createResolvers } = require('../GQLFactory/schemaFactory');
const GQLController = {};
const { makeExecutableSchema } = require('graphql-tools');

GQLController.createGQLSchema = (req, res, next) => {
  const { SQLSchema } = res.locals;
  try {
    const types = createTypes(SQLSchema);
    console.log('TYPES: ', types);
    const resolvers = createResolvers(SQLSchema);
    const typeDefs = types;
    res.locals.GQLSchema = { types, resolvers };
    res.locals.executedSchema = makeExecutableSchema({ typeDefs, resolvers });
    console.log('RES.LOCALS.EXECUTEDSCHEMA: ', res.locals.executedSchema);
    return next();
  } catch (err) {
    const errObject = {
      log: `Error in createGQLSchema: ${err}`,
      status: 400,
      message: {
        err: 'Unable to create GQL schema',
      },
    };
    return next(errObject);
  }
};

/* GQLController.createGQLServer = (req, res, next) => {
  const PG_URI = req.body.link;
  const { typeDefs, resolvers } = res.locals.GQLSchema;
  const pool = new Pool({
    connectionString: PG_URI,
  });
  const schema = makeExecutableSchema({ typeDefs, resolvers });

}; */
module.exports = GQLController;
