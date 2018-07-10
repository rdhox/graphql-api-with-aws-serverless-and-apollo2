const { ApolloServer, gql } = require('apollo-server-lambda');
const {userTypeDef, userResolvers} = require('./models/user');

const typeDefs = gql`${userTypeDef}`;
const resolvers = userResolvers;

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ event, context }) => ({
        headers: event.headers,
        functionName: context.functionName,
        event,
        context,
    })
});

exports.graphql = server.createHandler({
    cors: {
      origin: '*',
      credentials: true,
    },
  });