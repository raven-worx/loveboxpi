
## Notes

* added multilanguage support - english and german translations
* fixed bug where remote.it cloud service was not added when registering the device for the first time
* moved back to official 'waveshare/e-Paper' repository, since the pull request ~~[PR#214](https://github.com/waveshare/e-Paper/pull/214)~~ with the gpio cleanup fix was merged
* the systemd service is now restarted when LoveboxPi is installed/updated via deb package

## Install/Update

```console
wget -O /tmp/loveboxpi.deb https://github.com/raven-worx/loveboxpi/releases/download/v1.0.2/loveboxpi_1.0.2_armhf.deb
sudo apt update
sudo apt install /tmp/loveboxpi.deb
```
