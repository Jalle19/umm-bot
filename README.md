# umm-bot

[![CI](https://github.com/Jalle19/umm-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/Jalle19/umm-bot/actions/workflows/ci.yml)

Chat bot for Nord Pool REMIT UMM push notifications. Currently only handles production and transmission outages related 
to the Finnish market.

The bot listens of for push notifications from Nord Pool's UMM SignalR endpoint, then looks up the message details 
from the REST API and decides whether to send a chat message for it.

## Usage

The application takes sensitive configuration via environment variables, while the rest is configured with 
command-line options:

```
$ SLACK_CHANNEL_ID=foo SLACK_BOT_TOKEN=bar node dist/umm-slack-bot.js --help
node umm-slack-bot.js [options]

Options:
      --help          Show help                                        [boolean]
      --version       Show version number                              [boolean]
  -d, --databasePath  The path to the database file                   [required]
```

The specified database file is created if it doesn't exist (the directory must exist though).

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
