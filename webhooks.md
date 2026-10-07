---
title: Webhooks
display_title: Webhooks
canonical_url: https://developer.webex.com/docs/api/guides/webhooks
content_type: documentation
product_group:
- webex-suite
categories:
- admin
- messaging
- meeting
- calling
---

> Official Webex documentation: [View this page on Webex for Developers](https://developer.webex.com/docs/api/guides/webhooks)

Use webhooks to notify your apps when specific activities occur in Webex.

A webhook is an HTTP callback, or an HTTP POST, to a specified URL that notifies your app when a particular activity or “event” has occurred in one of your resources on the Webex platform. The benefit of using webhooks is that they allow your application to receive real-time data from Webex, so you can keep up with the state of your resources (i.e. rooms, messages, memberships, etc.).

For instance, let’s say you want to be notified when someone posts a message in a room that you’re interested in. You can create a webhook to have Webex notify you whenever new messages are posted into that room. So, instead of your app having to make repeated calls to the API to determine if a new message has been posted into the room, the webhook will automatically notify you of their occurrence.

Webhooks work well for your integrations and bots. For example, let’s say that you are creating a weather bot for Webex where users can ask your bot for the weather forecast in any city. You would want to use webhooks to let your app know when someone has sent a new weather request to your app. Your app can then take action, such as looking up the weather forecast for the requested city, and sending it back to the user.

You can create, or register, a webhook, via the Webex [Webhooks API](https://developer.webex.com/docs/api/v1/webhooks), to subscribe to the events in Webex that you would like to receive notifications for.

<div><Callout type="info">For information about Incoming Webhooks, where you can send information to Webex from outside services, see the [Incoming Webhooks Integration by Cisco Systems](https://apphub.webex.com/applications/incoming-webhooks-cisco-systems-38054-23307-75252) in the Webex App Hub. **IMPORTANT**:  Webex App Hub is not supported for Webex for Government (FedRAMP).</Callout></div>

To learn more about webhooks and how to create them, keep reading. For a step-by-step tutorial that shows you how to create a webhook, see [Experiment with Webex Webhooks](https://learninglabs.cisco.com/lab/collab-sparkwebhook/step/1) Cisco DevNet Learning Lab.

## Org/Admin/Compliance Officer level webhooks

Admins/Compliance Officers often want to have an org wide view of meeting events. Admins registered in Control Hub with the Full admin role have the capability to register webhooks for their org by setting an additional field `ownedBy` with the value set to `org`. Compliance officers can also register webhooks for their org by setting the value of `ownedBy` field with the value set to `org`. Both can filter to specific sites in the org or specific hosts by using the corresponding filter parameters described below.
To register for meeting events at Org level, the Org admin should also be a Webex site admin managing the relevant Webex sites or a Compliance officer for the organization. Integrations acting on-behalf of an admin need to have the Admin level scope to register org wide webhooks.

<div><Callout title="Webhook Disabled When Creator No Longer Exists" type="info">If a webhook was created by a user who has since been deleted or no longer exists in the organization, the webhook will be automatically disabled. This is expected behavior.
</Callout></div>

## Webex Webhooks

You can use the Webex API to [create a new webhook](https://developer.webex.com/docs/api/v1/webhooks/create-a-webhook), to [update an existing webhook](https://developer.webex.com/docs/api/v1/webhooks/update-a-webhook), or to [delete a webhook](https://developer.webex.com/docs/api/v1/webhooks/delete-a-webhook) once it's no longer needed.

When you create a webhook for a particular event, the notification data will be sent as an HTTP POST, in JSON format, to a URL of your choosing, each time it is triggered. Please note, that this URL must be publicly reachable and Internet-accessible by Webex, where your application will be listening for inbound HTTP requests. A response is also required from the web server for delivery. If Webex does not receive a successful HTTP response in the 2xx range from the server, your webhook will be disabled after 100 failed attempts within a five minute period.

In order to create a webhook for a resource, make sure that the auth token has a read scope for that resource. For example, to create a webhook that receives messages, the application must have the `spark:messages_read` scope enabled. Likewise, to create a webhook for notification of membership changes to a room, the application must have the `spark:memberships_read` scope. For more information on auth scopes and how to enable them, see [Scopes](https://developer.webex.com/docs/integrations#scopes).

<div><Callout type="info">In order to avoid service disruptions or negative performance impacts, we have set limits to the number of webhooks that can be registered. Of note is a threshold of 30000 webhooks per user for personal webhooks and a limit to org-wide webhooks of 1 with the ability to register additional webhooks for different resources and filters</Callout></div>

## Filtering Webhooks

In order to narrow down the data that you receive from webhooks, you can add filters to your webhooks. To do this, you can create a webhook for a resource that applies to an event, and then add a filter or a combination of filters to send you only notification content that is based on the added filter restrictions. For example, you can register a webhook for a membership resource and then add filters so that the webhook only applies to a specific room, by using the `roomId` or `roomType` filter.

You can also use more than one filter in a webhook. To use multiple filters, combine them with the “&” symbol. For example, to create a webhook that only sends notifications when a specific person performs an action in a specific room, such as sending a message or creating a membership, combine the `personEmail` and `roomId` filters: <code>personEmail=person@example.com&roomId=abc123</code>.

<div><Callout type="info">When creating a meeting webhook with a filter of `hostEmail` or `hostUserId`, or a converged recordings webhook with a filter of `ownerEmail` or `ownerId`, `ownedBy` must be set to `org`.</Callout></div>

For a list of available filters you can use, see “Resources, Events & Filters” below.

<div><Callout type="warning">You can only use ID filters for resources you have access to. If you do not have access to a particular resource or ID filter, you will receive an error (such as `invalid value for filter: roomId`) from the API.</Callout></div>

Alternatively, Webhooks also support what is commonly known as a “firehose” or “wildcard” webhook, which allows your app to subscribe to several commonly-used resources and/or events with a single webhook. For more information, see [The Firehose Webhook](https://developer.webex.com/docs/api/guides/webhooks#the-firehose-webhook).

### Resources, Events, & Filters

Below is a table of Webex events which webhooks can monitor for a given resource, the actions that will trigger these events, and the various filters you can add to narrow down the specific event notifications you would like to receive. Use an “&” between each filter to combine them:

<span id="123e4567-e89b-12d3-a456-426614174000" title="Table: Webhook Events and Filters"></span>

| Resource            | Event       | Trigger                                                                                                                | Filters (optional)                                                                                                                                                                                                                     |
|----------------------|-------------|------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `attachmentActions`    | `created`     | A user interacted with one of your [cards](https://developer.webex.com/docs/api/guides/cards).                                                    | `messageId` — limit to a particular message, by ID.<br />`personId` — limit to a particular person, by ID.<br />`roomId` — limit to a particular room, by ID.                                                                         |
| `dataSources`          | `created`     | A dataSource was registered. The developer can register this webhook with the scope spark:datasource_read. An admin with spark-admin:datasource_read. | `id` — limit to a particular data source, by ID.<br />`schemaId` — limit to a schema id, by ID.<br />`appId` — limit to a particular application id, by ID.<br />`orgId` — limit to a particular organization id, by ID.              |
| `dataSources`          | `deleted`     | A dataSource was deleted. The developer can register this webhook with the scope spark:datasource_read. An admin with spark-admin:datasource_read. | `id` — limit to a particular data source, by ID.<br />`schemaId` — limit to a schema id, by ID.<br />`appId` — limit to a particular application id, by ID.<br />`orgId` — limit to a particular organization id, by ID.              |
| `dataSources`          | `updated`     | A dataSource was updated. The developer can register this webhook with the scope spark:datasource_read. An admin with spark-admin:datasource_read. | `id` — limit to a particular data source, by ID.<br />`schemaId` — limit to a schema id, by ID.<br />`appId` — limit to a particular application id, by ID.<br />`orgId` — limit to a particular organization id, by ID.              |
| `memberships`          | `created`     | Someone joined a room that you're in or you've been added to a new room.                                                | `roomId` — limit to a particular room, by ID.<br />`personId` — limit to a particular person, by ID.<br />`personEmail` — limit to a particular person, by email.<br />`isModerator` — limit to moderators of a room.                |
| `memberships`          | `updated`     | Someone's membership was updated in a room that you're in; primarily used to detect moderator changes.                  | `roomId` — limit to a particular room, by ID.<br />`personId` — limit to a particular person, by ID.<br />`personEmail` — limit to a particular person, by email.<br />`isModerator` — limit to moderators of a room.                |
| `memberships`          | `deleted`     | Someone left or was kicked out of a room that you're in, or you left or were removed from a room; only triggers for group rooms, not 1-to-1 rooms. | `roomId` — limit to a particular room, by ID.<br />`personId` — limit to a particular person, by ID.<br />`personEmail` — limit to a particular person, by email.<br />`isModerator` — limit to moderators of a room.                |
| `messages`             | `created`     | New message posted into a room that you're in.                                                                          | `roomId` — limit to a particular room, by ID.<br />`roomType` — limit to a particular room type (such as `direct` or `group`).<br />`personId` — limit to a particular person, by ID.<br />`personEmail` — limit to a particular person, by email.<br />`mentionedPeople` — limit to messages which contain these mentioned people, by person ID; accepts `me` as a shorthand for your own person ID; separate multiple values with commas.<br />`hasFiles` — limit to messages which contain file content attachments.<br />`hasAttachments` — limit to messages which contain content attachments. |
| `messages`             | `deleted`     | A message was deleted from a room that you're in.                                                                       | `roomId` — limit to a particular room, by room ID.<br />`roomType` — limit to a particular room type (such as `direct` or `group`).<br />`personId` — limit to a particular person, by ID.<br />`personEmail` — limit to a particular person, by email.<br />`mentionedPeople` — limit to messages which contain these mentioned people, by person ID; accepts `me` as a shorthand for your own person ID; separate multiple values with commas.<br />`hasFiles` — limit to messages which contain file content attachments.<br />`hasAttachments` — limit to messages which contain content attachments. |
| `rooms`                | `created`     | A new room was created by you or one of your integrations.                                                              | `type` — limit to a particular room type (such as `direct` or `group`).<br />`isLocked` — limit to rooms that are locked.                                                                                                            |
| `rooms`                | `updated`     | A room that you're in was updated; primarily used to detect when a room becomes Locked or Unlocked.                     | `type` — limit to a particular room type (such as `direct` or `group`).<br />`isLocked` — limit to rooms that are locked.                                                                                                            |
| `rooms`                | `migrated`    | A room you or your bot is in was migrated to a different geography, usually during an organization’s change of data residency. There will be a change in the roomId and your app should use the new roomId. |                                                                                                                                                                                                                                       |
| `serviceApp`           | `authorized`  | A Service App that you created was authorized.                                                                          | `id` — limit to this Service App’s application id.<br />`friendlyName` — limit to this Service App’s friendly name.<br />`trainSiteNames` — limit to Service Apps authorized for this trainSiteName.<br />`adminTrainSiteNames` — limit to Service App authorized for this adminTrainSiteName. |
| `serviceApp`           | `deauthorized`| A Service App that you created was authorized.                                                                          | `id` — limit to this Service App’s application id.<br />`friendlyName` — limit to this Service App’s friendly name.<br />`trainSiteNames` — limit to Service Apps deauthorized for this trainSiteName.<br />`adminTrainSiteNames` — limit to Service App deauthorized for this adminTrainSiteName. |
| `telephony_calls`      | `created`     | You started (originated) or received a call.                                                                            | `personality` — limit to a particular call personality (`clickToDial`, `originator`, or `terminator`).<br />`state` — limit to a particular call state (`alerting`, `connected`, `connecting`, `disconnected`, `held`, or `remoteHeld`).<br />`number` — limit to calls to a particular address or number.<br />`personId` — limit to a particular person, by ID.<br />`callType` — limit to a particular call type (`emergency`, `external`, `location`, `organization`, `other`, or `repair`). |
| `telephony_calls`      | `updated`     | A call you started or received, was updated (e.g. call was answered, forwarded, resumed, etc.).                         | `personality` — limit to a particular call personality (`clickToDial`, `originator`, or `terminator`).<br />`state` — limit to a particular call state (`alerting`, `connected`, `connecting`, `disconnected`, `held`, or `remoteHeld`).<br />`number` — limit to calls to a particular address or number.<br />`personId` — limit to a particular person, by ID.<br />`callType` — limit to a particular call type (`emergency`, `external`, `location`, `organization`, `other`, or `repair`). |
| `telephony_calls`      | `deleted`     | A call you started or received, was disconnected (deleted).                                                             | `personality` — limit to a particular call personality (`clickToDial`, `originator`, or `terminator`).<br />`state` — limit to a particular call state (`alerting`, `connected`, `connecting`, `disconnected`, `held`, or `remoteHeld`).<br />`number` — limit to calls to a particular address or number.<br />`personId` — limit to a particular person, by ID.<br />`callType` — limit to a particular call type (`emergency`, `external`, `location`, `organization`, `other`, or `repair`). |
| `telephony_conference` | `created`     | A conference is created.                                                                                                |                                                                                                                                                                                                                                       |
| `telephony_conference` | `updated`     | A conference is updated through other conference APIs (held, resumed, muted, unmuted, participantMuted, participantUnmuted, updated, participantDeafened, participantUndeafened). |                                                                                                                                                                                                                                       |
| `telephony_conference` | `deleted`     | A conference is deleted when the conference ends.                                                                       |                                                                                                                                                                                                                                       |
| `telephony_mwi`        | `updated`     | Your Webex Calling voicemail messages were updated (e.g. message was received, deleted, marked as read, or marked as unread). |                                                                                                                                                                                                                                       |
| `telephony_agent`      | `updated`     | A call queue agent's state changed, the agent joined or left a queue, or the agent entered a wrap-up code. | `actorId` — limit to a particular actor, by ID.<br />`actorType` — limit to a particular actor type (`PEOPLE`, `PLACE`, or `VIRTUAL_LINE`). |
| `telephony_agentMonitoring` | `updated` | An agent monitoring status was updated when a queue call to an agent ends or is transferred. | `actorId` — limit to a particular actor, by ID.<br />`actorType` — limit to a particular actor type (`PEOPLE`, `PLACE`, or `VIRTUAL_LINE`). |
| `telephony_queue`      | `updated`     | A call queue event occurred (e.g. call added, answered, abandoned, bounced, overflowed, stranded, transferred, or policy applied). | `actorId` — limit to a particular actor, by ID. |
| `telephony_queueMonitoring` | `updated` | Real-time call center monitoring status was updated, including queue metrics and agent availability. | `actorId` — limit to a particular actor, by ID. |
| `meetings`             | `created`     | A new meeting was created.                                                                                              | `id` — Meeting Id.<br />`meetingNumber` — Meeting number.<br />`meetingType` — Meeting type.<br />`state` — Meeting state.<br />`hostEmail` — Email address for the meeting host.<br />`hostUserId` — Unique identifier for meeting host.<br />`siteUrl` — Webex site URL to query. |
| `meetings`             | `updated`     | A meeting that you're in was updated.                                                                                   | `id` — Meeting Id.<br />`meetingNumber` — Meeting number.<br />`meetingType` — Meeting type.<br />`state` — Meeting state.<br />`hostEmail` — Email address for the meeting host.<br />`hostUserId` — Unique identifier for meeting host.<br />`siteUrl` — Webex site URL to query. |
| `meetings`             | `deleted`     | A meeting that you're in was deleted.                                                                                   | `id` — Meeting Id.<br />`meetingNumber` — Meeting number.<br />`meetingType` — Meeting type.<br />`state` — Meeting state.<br />`hostEmail` — Email address for the meeting host.<br />`hostUserId` — Unique identifier for meeting host.<br />`siteUrl` — Webex site URL to query. |
| `meetings`             | `started`     | A meeting was started.                                                                                                  | `id` — Meeting Id.<br />`meetingNumber` — Meeting number.<br />`meetingType` — Meeting type.<br />`state` — Meeting state.<br />`hostEmail` — Email address for the meeting host.<br />`hostUserId` — Unique identifier for meeting host.<br />`siteUrl` — Webex site URL to query. |
| `meetings`             | `ended`       | A meeting was ended.                                                                                                    | `id` — Meeting Id.<br />`meetingNumber` — Meeting number.<br />`meetingType` — Meeting type.<br />`state` — Meeting state.<br />`hostEmail` — Email address for the meeting host.<br />`hostUserId` — Unique identifier for meeting host.<br />`siteUrl` — Webex site URL to query. |
| `recordings`           | `created`     | A new recording was created.                                                                                            | `id` — Recording Id.<br />`meetingId` — Unique identifier for the parent meeting series, scheduled meeting or meeting instance for which recordings are being requested.<br />`scheduledMeetingId` — Unique identifier for the parent scheduled meeting which the recording belongs to.<br />`meetingSeriesId` — Unique identifier for the parent meeting series which the recording belongs to.<br />`hostEmail` — Email address for the meeting host.<br />`hostUserId` — Unique identifier for meeting host.<br />`siteUrl` — Webex site URL to query. |
| `recordings`           | `updated`     | A recording that you're in was updated.                                                                                 | `id` — Recording Id.<br />`meetingId` — Unique identifier for the parent meeting series, scheduled meeting or meeting instance for which recordings are being requested.<br />`scheduledMeetingId` — Unique identifier for the parent scheduled meeting which the recording belongs to.<br />`meetingSeriesId` — Unique identifier for the parent meeting series which the recording belongs to.<br />`hostEmail` — Email address for the meeting host.<br />`hostUserId` — Unique identifier for meeting host.<br />`siteUrl` — Webex site URL to query. |
| `recordings`           | `deleted`     | A recording that you're in was deleted permanently. There is no notification provided for moving a recording to the trash bin currently. | `id` — Recording Id.<br />`meetingId` — Unique identifier for the parent meeting series, scheduled meeting or meeting instance for which recordings are being requested.<br />`scheduledMeetingId` — Unique identifier for the parent scheduled meeting which the recording belongs to.<br />`meetingSeriesId` — Unique identifier for the parent meeting series which the recording belongs to.<br />`hostEmail` — Email address for the meeting host.<br />`hostUserId` — Unique identifier for meeting host.<br />`siteUrl` — Webex site URL to query. |
| `convergedRecordings`  | `created`     | A new converged recording (for now call recording) was created.                                                         | `recordingId` — Recording ID.<br />`ownerId` — Identifier for the recording owner for which recordings are being requested.<br />`ownerEmail` — Email address for the recording owner.<br />`ownerType` — The owner type for the recording.<br />`storageRegion` — Unique identifier for the region where the recording is stored.<br />`serviceType` — Unique identifier for the service type which the recording belongs to.<br />`locationId` — Unique identifier for location. |
| `convergedRecordings`  | `deleted`     | A new converged recording (for now call recording) was deleted.                                                         | `recordingId` — Recording ID.<br />`ownerId` — Identifier for the recording owner for which recordings are being requested.<br />`ownerEmail` — Email address for the recording owner.<br />`ownerType` — The owner type for the recording.<br />`storageRegion` — Unique identifier for the region where the recording is stored.<br />`serviceType` — Unique identifier for the service type which the recording belongs to.<br />`locationId` — Unique identifier for location. |
| `convergedRecordings`  | `updated`     | A converged recording (for now call recording) was updated.                                                             | `recordingId` — Recording ID.<br />`ownerId` — Identifier for the recording owner for which recordings are being requested.<br />`ownerEmail` — Email address for the recording owner.<br />`ownerType` — The owner type for the recording.<br />`storageRegion` — Unique identifier for the region where the recording is stored.<br />`serviceType` — Unique identifier for the service type which the recording belongs to.<br />`locationId` — Unique identifier for location. |
| `meetingParticipants`  | `joined`      | A participant has joined the meeting.                                                                                   | `id` — Participant Id.<br />`meetingId` — Meeting Instance Id.<br />`state` — Meeting state.<br />`hostEmail` — Email address for the meeting host.<br />`hostPersonId` — Unique identifier for meeting host.<br />`siteUrl` — Webex site URL to query. |
| `meetingParticipants`  | `left`        | A participant has left the meeting.                                                                                     | `id` — Participant Id.<br />`meetingId` — Meeting Instance Id.<br />`state` — Meeting state.<br />`hostEmail` — Email address for the meeting host.<br />`hostPersonId` — Unique identifier for meeting host.<br />`siteUrl` — Webex site URL to query. |
| `meetingTranscripts`   | `created`     | A new transcript was created.                                                                                           | `id` — Transcript Id.<br />`meetingId` — Unique identifier for the parent meeting series, scheduled meeting or meeting instance for which transcripts are being requested.<br />`scheduledMeetingId` — Unique identifier for the parent scheduled meeting which the transcript belongs to.<br />`meetingSeriesId` — Unique identifier for the parent meeting series which the transcript belongs to.<br />`hostEmail` — Email address for the meeting host.<br />`hostUserId` — Unique identifier for meeting host.<br />`siteUrl` — Webex site URL to query. |
| `uc_counter`           | `updated`     | A dedicated instance performance counter was updated. This is an organization-wide webhook for admins. The scope required to register this webhook is `wxc-dedicateduc:admin_perfmon_read`. | `clusterName` — The cluster name.<br />`hostName` — The host name.<br />`nodeType` — The node type.<br />`agentId` — The agent id.                                                                                                     |
| `adminBatchJobs`       | `statusChanged` | A scheduled admin batch job, like “location change”, changed the status.                                                | `jobType` — The job type.<br /><br/>**IMPORTANT**: If you register for a generic webhook without a `jobType` filter, you may receive additional notifications beyond what was scheduled via API and Control Hub. |

Note: The `hostPersonId` filter in `meetingParticipants` resource refers to the same element as the `hostUserId` filter in `meetings`, `recordings` and `meetingTranscripts` resources.

`Telephony_calls`, `telephony_conference`, and `telephony_mwi` webhooks only provide notifications for Webex Calling users.

Remember, bots can only see messages in which they're specifically mentioned. See [Differences Between Bots & People](https://developer.webex.com/docs/bots#differences-between-bots-and-people) in the Bots guide for more details.

For more examples of uses for webhooks and filtering, see our blog post [Using Webhooks - Rooms, Messages, Memberships and more](https://developer.webex.com/blog/using-webhooks---rooms-messages-memberships-and-more-). For a step-by-step tutorial that shows you how to create a webhook and add filters, see [Experiment with Webex Webhooks](https://learninglabs.cisco.com/lab/collab-sparkwebhook/step/1) over in Cisco DevNet.

## The Firehose Webhook

The Webhooks resource supports what is commonly known as a “firehose” or “wildcard” webhook, which allows your app to subscribe to all events from several commonly-used resources with a single webhook. There are two types of firehoses. One is a “single resource firehose” and the other is an “all resource” firehose.

<div><Callout type="info">The following resources support firehose webhooks: memberships, messages, and rooms.</Callout></div>

### Single Resource Firehose

A single resource firehose webhook will send a notification for any created/updated/deleted event using `all` activities as a trigger for a given resource type. For example, to subscribe to `all` events for the `messages` resource, your app can create a webhook as shown below:

```json
{
  "name": "Messages Firehose",
  "targetUrl": "https://example.com/message-events",
  "resource": "messages",
  "event": "all"
}
```

Note: The `all` notably does not yet include any other events but `created`, `updated`, `deleted`. In particular for meetings `started`/`ended` and meetingsParticipant `joined`/`left` individual webhooks must be registered.

### All Resource Firehose

An all resource firehose webhook will send a notification for any event for all supported resource types. The following resources will be included in the “all resource” firehose: memberships, messages, and rooms.

For example, to subscribe to *all* events that occur on *all* supported resources, create a webhook with the resource set to `all` and the event set to `all` as shown below:

```json
{
  "name": "Awesome Bot Webhook Firehose",
  "targetUrl": "https://example.com/spark-events",
  "resource": "all",
  "event": "all"
}
```

<div><Callout type="warning">Creating a webhook for `all` resources requires that you have read [scopes](https://developer.webex.com/docs/integrations#scopes) for all supported resources: memberships, messages, and rooms.</Callout></div>

## Creating a Webhook

To begin receiving platform events, you first need to register a webhook with Webex. To create a webhook, make an HTTP POST to `/webhooks` with some basic information as shown in the example below:

```json
{
  "name": "New message in 'Project Unicorn' room",
  "targetUrl": "https://example.com/spark-hook",
  "resource": "messages",
  "event": "created",
  "filter": "roomId=Y2lzY29zcGFyazovL3VzL1JPT00vYmJjZWIxYWQtNDNmMS0zYjU4LTkxNDctZjE0YmIwYzRkMTU0"
}
```

#### Request Parameters

<span id="550e8400-e29b-41d4-a716-446655440000" title="Table: Webhook Request Parameters"></span>

| Parameter   | Explanation                                                                                                                                                                                                                                                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`      | A label to remember why it was created. Use it for whatever purpose you'd like.                                                                                                                                                                                                                                                          |
| `targetUrl` | Tell Webex where you'd like to receive platform events. See the following [Handling Requests from Webex](https://developer.webex.com/docs/api/guides/webhooks#handling-requests-from-webex-teams) section for detailed information about the webhook request format and best practices for scaling your infrastructure.                                                                |
| `resource`  | Indicates the noun being observed and will generally match the plural form of one of the Webex APIs (i.e. messages).                                                                                                                                                                                                               |
| `event`     | Further narrows the events by specifying the action that would trigger a notification to your backend.                                                                                                                                                                                                                                   |
| `filter`    | A set of filtering critera. Generally speaking, webhook filters will be a subset of the query parameters available when GETing a list of the target resource. It is an optional property. To add multiple filters, separate them with the “&” symbol. For more information about filters, see [Filtering Webhooks](https://developer.webex.com/docs/api/guides/webhooks#filtering-webhooks). |
| `secret`    | An optional field used to generate a payload signature. See [Handling Requests from Webex](https://developer.webex.com/docs/api/guides/webhooks#handling-requests-from-webex-teams) for more information.                                                                                                                                                                                                              |

A valid OAuth token is only required to create a webhook. As long as the webhook receives a successful HTTP response it will run indefinitely, even if the OAuth token has expired. However, since initial webhook notifications only contain metadata and encrypted information, sensitive data will always remain secure. See [Handling Requests from Webex](https://developer.webex.com/docs/api/guides/webhooks#handling-requests-from-webex-teams) for more information.

## User Level Scopes for Meeting Related Webhooks

The following scopes are required to create, get, list, update or delete webhooks at user level for meeting related resources:

<span id="550e8400-e29b-41d4-a716-446655440001" title="Table: User Level Scopes for Meeting Related Webhooks"></span>

| Scope                    | Resource         | Usage                                                                  |
|---------------------------|---------------------|------------------------------------------------------------------------|
| `meeting:schedules_read`    | `meetings`            | Manipulate webhooks of `meetings` resource as a normal user            |
| `meeting:participants_read` | `meetingParticipants` | Manipulate webhooks of `meetingParticipants` resource as a normal user |
| `meeting:recordings_read`   | `recordings`          | Manipulate webhooks of `recordings` resource as a normal user          |
| `meeting:transcripts_read`  | `meetingTranscripts`  | Manipulate webhooks of `meetingTranscripts` resource as a normal user  |
## Organization/Admin/Compliance Officer Level Scopes for Meeting Related Webhooks

The following scopes are required to create, get, list, update or delete webhooks at organization level for meeting related resources:

<span id="550e8400-e29b-41d4-a716-446655440002" title="Table: Organization/Admin/Compliance Officer Level Scopes for Meeting Related Webhooks"></span>

| Scope                          | Resource                      | Usage                                                                                         |
|---------------------------------|--------------------------------|-----------------------------------------------------------------------------------------------|
| `meeting:admin_schedule_read`     | `meetings`                       | Manipulate webhooks of `meetings` resource as an admin                                        |
| `meeting:admin_participants_read` | `meetingParticipants`            | Manipulate webhooks of `meetingParticipants` resource as an admin                             |
| `meeting:admin_recordings_read`   | `recordings`                     | Manipulate webhooks of `recordings` resource as an admin                                      |
| `meeting:admin_transcripts_read`  | `meetingTranscripts`             | Manipulate webhooks of `meetingTranscripts` resource as an admin                              |
| `spark-compliance:meetings_read`  | `recordings, meetingTranscripts` | Manipulate webhooks of `recordings` and `meetingTranscripts` resource as a compliance officer |


## Handling Requests from Webex

When one of your webhooks is triggered by an event, Webex will send an HTTP POST to the backend `targetUrl` that you've specified. The body of the POST will look something like this:

```json
{
  "id": "Y2lzY29zcGFyazovL3VzL1dFQkhPT0svZjRlNjA1NjAtNjYwMi00ZmIwLWEyNWEtOTQ5ODgxNjA5NDk3",
  "name": "New message in 'Project Unicorn' room",
  "resource": "messages",
  "event": "created",
  "filter": "roomId=Y2lzY29zcGFyazovL3VzL1JPT00vYmJjZWIxYWQtNDNmMS0zYjU4LTkxNDctZjE0YmIwYzRkMTU0",
  "orgId": "OTZhYmMyYWEtM2RjYy0xMWU1LWExNTItZmUzNDgxOWNkYzlh",
  "createdBy": "Y2lzY29zcGFyazovL3VzL1BFT1BMRS9mNWIzNjE4Ny1jOGRkLTQ3MjctOGIyZi1mOWM0NDdmMjkwNDY",
  "appId": "Y2lzY29zcGFyazovL3VzL0FQUExJQ0FUSU9OL0MyNzljYjMwYzAyOTE4MGJiNGJkYWViYjA2MWI3OTY1Y2RhMzliNjAyOTdjODUwM2YyNjZhYmY2NmM5OTllYzFm",
  "ownedBy": "creator",
  "status": "active",
  "actorId": "Y2lzY29zcGFyazovL3VzL1BFT1BMRS9mNWIzNjE4Ny1jOGRkLTQ3MjctOGIyZi1mOWM0NDdmMjkwNDY",
  "data":{
    "id": "Y2lzY29zcGFyazovL3VzL01FU1NBR0UvOTJkYjNiZTAtNDNiZC0xMWU2LThhZTktZGQ1YjNkZmM1NjVk",
    "roomId": "Y2lzY29zcGFyazovL3VzL1JPT00vYmJjZWIxYWQtNDNmMS0zYjU4LTkxNDctZjE0YmIwYzRkMTU0",
    "personId": "Y2lzY29zcGFyazovL3VzL1BFT1BMRS9mNWIzNjE4Ny1jOGRkLTQ3MjctOGIyZi1mOWM0NDdmMjkwNDY",
    "personEmail": "matt@example.com",
    "created": "2015-10-18T14:26:16.000Z"
  }
}
```

The first few properties shown above are called the “envelope.” They identify all webhooks that are sent. This envelope contains the following information:

<span id="550e8400-e29b-41d4-a716-446655440003" title="Table: Webhook Envelope Parameters"></span>

| Parameter   | Explanation                                                                                                                                                                                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`        | The webhook ID. This is the same ID returned when you created the webhook and is what you would use to view the webhook configuration or delete the webhook.                                                                                                                           |
| `name`      | The name you gave your webhook when you created it.                                                                                                                                                                                                                                    |
| `resource`  | The resource the webhook data is about.                                                                                                                                                                                                                                                |
| `event`     | The type of event this webhook is for.                                                                                                                                                                                                                                                 |
| `filter`    | Lists any filters that you applied that triggered this webhook.                                                                                                                                                                                                                        |
| `orgId`     | The organization that owns the webhook. This usually is the organization the user that added the webhook belongs to. This ID can be used to [view the Organization details with the API](https://developer.webex.com/docs/api/v1/organizations/get-organization-details).                                                      |
| `createdBy` | The `personId` of the user that added the webhook.                                                                                                                                                                                                                                     |
| `appId`     | The ID of the Webex app that was used to create the webhook. This could be one of your apps, an app from the [Webex App Hub](https://apphub.webex.com), a privately developed app, or this Webex for Developers site if the webhook was created with your personal access token. <div><Callout type="warning">Webex App Hub is not supported for Webex for Government (FedRAMP)</Callout></div>
|
| `ownedBy`   | Indicates if the webhook is owned by the *org* or the *creator*. Webhooks owned by the creator can only receive events that are accessible to the creator of the webhook. Those owned by the organization will receive events that are visible to anyone in the organization.          |
| `status`    | Indicates if the webhook is active. A webhook that cannot reach your URL is disabled. Thus, for all webhooks you receive, the status will always read ‘active.’                                                                                                                        |
| `actorId`   | The `personId` of the user that caused the webhook to be sent. For example, on a *messsage created* webhook, the author of the message will be the actor. On a *membership deleted* webhook, the actor is the person who removed a user from a room.                                   |
| `data`      | Contains the JSON representation of the resource that triggered the webhook. **Note:** The `data` property's `orgId` is currently for internal usage only, and will be removed in the future. Use the `orgId` in the envelope instead of the one in the `data` property.                  |

### Using the Data Property

The webhook's `data` property contains the JSON representation of the resource event that triggered the webhook. For example, if you created a webhook that triggers when `messages` are `created` (i.e. posted into a room), then the `data` property will contain the JSON representation for a message resource, as specified in the [Messages API](https://developer.webex.com/docs/api/v1/messages) documentation.  Likewise, if you created a webhook that triggers when `telephony_calls` are `created` (i.e. a call is originated or received), then the `data` property will contain the JSON representation for a telephony_calls resource, as specified in the [Call-Control API](https://developer.webex.com/docs/api/v1/call-controls) documentation.

If the webhook's resource event contains sensitive data, the data property will only contain “metadata” about the event. See "Handling Sensitive Data" below for more information about how to retrieve the entire resource.

### Handling Sensitive Data

Webex encrypts sensitive room content such as titles and message text using keys only available to the members of that room. This means that not even the Webex operations team can read your messages, making it one of the most secure communications platforms on the planet. This level of security has a subtle impact on webhooks.

You'll notice in the above message webhook example that the `text` property is missing. That's because room messages are considered sensitive information and since Webex initiated the request to your backend, it did not have your Access Token with which to decrypt the message. In order to get the sensitive information, your app needs to use the resource `id` to fetch the full resource. Using the above messages example, your app could fetch the complete message object along with the text by doing an authenticated (via your Bearer Token) GET request to `/messages/{id}` as shown below:

`GET https://webexapis.com/v1/messages/Y2lzY29zcGFyazovL3VzL01FU1NBR0UvMzIzZWUyZjAtOWFhZC0xMWU1LTg1YmYtMWRhZjhkNDJlZjlj`

```json
{
  "id": "Y2lzY29zcGFyazovL3VzL01FU1NBR0UvMzIzZWUyZjAtOWFhZC0xMWU1LTg1YmYtMWRhZjhkNDJlZjlj",
  "roomId": "Y2lzY29zcGFyazovL3VzL1JPT00vYmJjZWIxYWQtNDNmMS0zYjU4LTkxNDctZjE0YmIwYzRkMTU0",
  "personId": "Y2lzY29zcGFyazovL3VzL1BFT1BMRS9mNWIzNjE4Ny1jOGRkLTQ3MjctOGIyZi1mOWM0NDdmMjkwNDY",
  "personEmail": "matt@example.com",
  "text": "Something interesting and potentially sensitive",
  "created": "2015-12-04T17:33:56.767Z"
}
```

### Authenticating Requests

Webhooks require that the Webex Cloud be able to reach your backend over HTTP. One common question from enterprise IT is how to authenticate that a request is coming from Cisco. We are continuously adding infrastructure to the Webex Cloud so only listing IPs that are allowed is not practical. To solve this, we introduced a technique for cryptographically verifying the JSON payload based on a shared secret of your choosing.

When creating a webhook you can now supply a `secret` parameter. If specified, every message sent to your backend will contain a new HTTP header called `X-Spark-Signature` containing an [HMAC-SHA1](https://en.wikipedia.org/wiki/Hash-based_message_authentication_code) signature of the JSON payload.

The `secret` parameter can be specified when [creating a webhook](https://developer.webex.com/docs/api/v1/webhooks/create-a-webhook).

### Data Synchronization Meetings

We generally provide webhooks that are actionable. This means the webhook has enough information to be useful to drive most workflow scenarios. We have found some customers who want to query additional details from the REST resource after receiving a webhook. The REST resource may not be immediately in sync with the webhook received, which is sent as soon as possible.
Due to a complex multistage backend, our current SLA is a sync between webhook and REST resource within 10 minutes for 99.5% of cases.
Let’s use a practical example. A developer registers for the meetingParticipants:joined webhook. After the webhook is received the developer wants to query the /meetingParticipants/{id} REST resource. This request may return a 404 as long as the REST resource is synching with the subsystems.

## Disabled Webhooks

A webhook's `targetUrl` specifies the server endpoint that will receive the webhook payload. If Webex attempts to deliver 100 webhook notifications within five minutes and the server either becomes unreachable or does not respond with a successful HTTP code in the 2xx range, the webhook will be disabled. Once a webhook is disabled, it will not be reenabled automatically.

To see the current status of a webhook, use the [Get Webhook Details](https://developer.webex.com/docs/api/v1/webhooks/get-webhook-details) API endpoint. To reactivate a disabled webhook, use the [Update a Webhook](https://developer.webex.com/docs/api/v1/webhooks/update-a-webhook) API endpoint with the `status` parameter set to ‘active’.

Before reenabling a disabled webhook, ensure that any issues which prevented successful delivery have been corrected. Webhooks reenabled within five minutes of being automatically disabled will have a lower threshold for delivery problems. During this period, if the server becomes unreachable or does not respond with a successful HTTP code, the webhook will be immediately disabled again.
