# umm-bot

Chat bot for Nord Pool REMIT UMM push notifications. Currently only handles production and transmission outages related 
to the Finnish market.

The bot listens of for push notifications from Nord Pool's UMM SignalR endpoint, then looks up the message details 
from the REST API and decides whether to send a chat message for it.

## Running as a systemd service

1. Copy the provided service file to /etc/systemd/system and modify the paths to match your deployment
2. Run `systemctl edit umm-bot` and add the following, providing proper values for all variables:

```
[Service]
Environment="SLACK_CHANNEL_ID="
Environment="SLACK_BOT_TOKEN="
```

3. Run the service

## More information

* https://developers.nordpoolgroup.com/reference/umm-introduction
* https://developers.nordpoolgroup.com/reference/umm-push-notifications

### Getting details about a particular message

```bash
curl -X GET --header 'Accept: application/json' 'https://ummapi.nordpoolgroup.com/messages/3b2b1643-27cd-40ad-9651-a198fd0246d7/2'
```
