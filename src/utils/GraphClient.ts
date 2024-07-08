import { HttpLink, InMemoryCache, NormalizedCacheObject } from "@apollo/client";
import { ApolloClient } from "@apollo/client/core";

// const wsLink = new GraphQLWsLink(
//   createClient({
//     url: wsLink,
//   }),
// );

// const splitLink = split(
//   ({ query }) => {
//     const definition = getMainDefinition(query);
//     return (
//       definition.kind === "OperationDefinition" &&
//       definition.operation === "subscription"
//     );
//   },
//   // wsLink,
//   httpLink,
// );

export class GraphClient {
  client: ApolloClient<NormalizedCacheObject>;

  constructor(url: string) {
    const httpLink = new HttpLink({
      uri: url,
    });

    this.client = new ApolloClient({
      link: httpLink,
      cache: new InMemoryCache(),
    });
  }
}
