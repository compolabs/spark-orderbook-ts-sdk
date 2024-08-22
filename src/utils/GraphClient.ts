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

    const wsLink =
      typeof window !== "undefined"
        ? new GraphQLWsLink(
            createClient({
              url: wsUrl,
            }),
          )
        : null;

    const splitLink =
      typeof window !== "undefined" && wsLink !== null
        ? split(
            ({ query }) => {
              const def = getMainDefinition(query);
              return (
                def.kind === "OperationDefinition" &&
                def.operation === "subscription"
              );
            },
            wsLink,
            httpLink,
          )
        : httpLink;

    this.client = new ApolloClient({
      link: splitLink,
      cache: new InMemoryCache(),
    });
  }
}
