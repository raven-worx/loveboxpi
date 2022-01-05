# LoveboxPi

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/raven-worx/loveboxpi?logo=github&sort=semver)](https://github.com/raven-worx/loveboxpi/releases)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

This is a DIY lovebox implementation using a Waveshare e-paper display and a RaspberryPi.

[![Watch LoveboxPi Demo on YOUTUBE](http://img.youtube.com/vi/fF88PX4ILu4/0.jpg)](http://www.youtube.com/watch?v=fF88PX4ILu4 "Watch LoveboxPi Demo on YOUTUBE")

## Features

* Web-Interface to control and configure LoveboxPi
* Remote access over internet via [remote.it service](https://remote.it/)
* support for notification LED
* support for up to 4 HW buttons with assignable actions
* REST interface (see specification in openapi folder - e.g. use [swagger](http://swagger.io/))

## Hardware

* [RaspberryPi Zero W(H)](https://amzn.to/3ssZmjw)
    * any other RaspberryPi version is also supported
    * RaspberryPi Zero suffix: **W** = *Wireless*, **H** = *Already attached PIN header*
* [RaspberryPi power supply](https://amzn.to/3Jiqx6n)
* [Waveshare 2.7inch e-Paper Display (HAT)](https://amzn.to/3FxGPpS)
    * the *HAT* version is optional, but it has the advantage of fast and easy connection. Also it already comes with 4 buttons on the board
* [RGB-LED](https://amzn.to/3qrZOMa) (*optional*)
* [Pi 40-Pin Y-Header/splitter](https://amzn.to/3EsjeWl) (*optional*)
    * this especially helps to connect to GPIO pins even when using the HAT version of the epd display

*Note*: the links of the above listed hardware components to Amazon are exemplary. If you want to support me you can use them to order the linked products using these links.

## Software

LoveboxPi is built upon/with the following software components:

* [RaspberryPi OS Lite (Bullseye)](https://www.raspberrypi.com/software/)
* [Python3](https://www.python.org/)
* [Bootstrap](https://getbootstrap.com/) v5.1
* [jQuery](https://jquery.com/) v3.6.0
* [fabricjs](http://fabricjs.com/) v4.6.0
* [js.cookie](https://github.com/js-cookie/js-cookie) v3.0.1
* [EmojiSymbols](https://emojisymbols.com/) webfont
* [Simple-Translator](https://github.com/andreasremdt/simple-translator) v2.0.4
* [remote.it CLI tool](https://docs.remote.it/software/cli)

## Prepare your RaspberryPi

If not already done flash a SD-card with the [RaspberryPi OS](https://www.raspberrypi.com/software/). The **Lite** version is enough for this project. Make sure to use the latest version, at time of writing this is *Bullseye*.

You can also use any other Debian based operating system.

After successful flashing mount the SD card on a host PC (Windows, Linux) and place a file named `ssh` (no content, no file extension) into the **boot** partion of the SD card.

You might also add your Wifi network connection at this point. For a detailed description read the [official RaspberryPi documentation](https://www.raspberrypi.com/documentation/computers/configuration.html#setting-up-a-headless-raspberry-pi)

Once your RaspberryPi has been booted from your SD-card you can connect to it via SSH. By default the username is `pi` and the password is `raspberry`.

The Waveshare EPD displays require to enable the SPI interface on the RPi (`raspi-config` command). `raspi-config` can also be used to expand your SD-card to use it's full storage capacity and to set the hostname of the device, e.g. to "loveboxpi"

It's also recommended that you change the default password of your user for security reasons.

## Installation

To install (or update) LoveboxPi on your device all you need to do is to run the following command. Make sure you replace `VERSION=X.X.X` with the desired LoveboxPi release version. 

```console
VERSION=X.X.X wget -O /tmp/loveboxpi.deb https://github.com/raven-worx/loveboxpi/releases/download/v${VERSION}/loveboxpi_${VERSION}_armhf.deb
sudo apt update
sudo apt install /tmp/loveboxpi.deb
```

## Cloud / Mobile

If you like you can even securely access the LoveboxPi web interface remotely from anywhere via internet using the [remote.it service](https://remote.it/).
Just create an free remote.it account, which supports up to 5 devices for free.

Make sure you do **not** create an account using SSO (Google) but with simply email and password credentials. This is required by the remote.it CLI tool used by LoveboxPi.

Once the setup via the LoveboxPi web interface is done you can access the LoveboxPi either via the remote.it website on your account page or also via the official remote.it mobile app (Android, iOS).

## 3D Printer files

I also designed a 3d printable *reference design* of a box for the hardware components listed above.

You can either find the files in the `3d` folder of this repository or also at [thingiverse.com](https://www.thingiverse.com/thing:5174353).

## License

Licensed under [GPLv3](https://github.com/raven-worx/loveboxpi/blob/master/LICENSE)
