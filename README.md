# umm-bot

Chat bot for Nord Pool REMIT UMM push notifications. Currently only handles production and transmission outages related 
to the Finnish market.

## Running as a systemd service

1. Copy the provided service file to /etc/systemd/system and modify the paths to match your deployment
2. Run `systemctl edit umm-bot` and add the following, providing proper values for all variables:

```
[Service]
Environment="SLACK_CHANNEL_ID="
Environment="SLACK_BOT_TOKEN="
```

3. Run the service
