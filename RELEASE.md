
## Notes

* using a custom fork of 'waveshare/e-Paper' repository containing a fix for the gpio cleanup - only until the [PR#214](https://github.com/waveshare/e-Paper/pull/214) is merged
* fixed possible issue in parsing remote.it status information when running server on port 80
* using gpiozero again for led and button handling

## Install/Update

```console
wget -O /tmp/loveboxpi.deb https://github.com/raven-worx/loveboxpi/releases/download/v1.0.1/loveboxpi_1.0.1_armhf.deb
sudo apt update
sudo apt install /tmp/loveboxpi.deb
```
