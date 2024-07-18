import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
  split,
} from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";
import { GraphClientConfig } from "src/interface";

export class GraphClient {
  client: ApolloClient<NormalizedCacheObject>;

  constructor({ httpUrl, wsUrl }: GraphClientConfig) {
    const httpLink = new HttpLink({
      uri: httpUrl,
    });

    const wsLink = new GraphQLWsLink(
      createClient({
        url: wsUrl,
      }),
    );

    const splitLink = split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
        );
      },
      wsLink,
      httpLink,
    );

    this.client = new ApolloClient({
      link: wsLink,
      cache: new InMemoryCache(),
    });
  }
}
