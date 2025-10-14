<a id="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://tent.micro-stack.org/favicon.ico">
    <img src="https://tent.micro-stack.org/favicon.ico" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Micro Tent</h3>

  <p align="center">
    A resource finding & planning tool for creating multiple hyper-converged-infrastructures.
    <br />
    <a href="https://www.micro-stack.org/"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://tent.micro-stack.org/">View Demo</a>
    &middot;
    <a href="https://github.com/ai-micro-stack/micro-tent/issues">Report Bug</a>
    &middot;
    <a href="https://github.com/ai-micro-stack/micro-tent/projects">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

[![Micro Tent Home Page][product-screenshot]](https://tent.micro-stack.org)

The Micro Tent is computing resource finding and planning application. It is able to create any numbers of the Hyper Converged Infrastructures in multiple local network environment.

The key features:

- Using popular distributed storage software to create the hyper converged storage clusters;
- Using popular container orchestration software to create hyper convergence computing clusters;
- Using popular load balancer software to bind multiple resources implementing high availability;
- Using popular open source cluster management software to support the cluster management;

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Developed With

The application consists of backend and frontend. The backend is developed with Bash script, Node and Express; the frontend is developed with Vite, React & Bootstrap;

- [![Node][Node.js]][Node-url]
- [![Express][Express.js]][Express-url]
- [![GNU Bash][Bash.sh]][Bash-url]
- [![Xterm.js][Xterm.js]][Xterm-url]
- [![Vite][Vite.js]][Vite-url]
- [![React][React.js]][React-url]
- [![Bootstrap][Bootstrap.com]][Bootstrap-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

There are some prerequisites to run the project. To follow the instructions, we can setup the project local development environment.

### Prerequisites

We need to meet following prerequisites to run the server.

#### Server Hardware

- CPU: 4 cores
- MEM: 12GB (minimum 8GB)
- DISK: >250GB

#### Server OS

- Any kind of Linux OS
- Ubuntu 22.04 TLS or 24.04 TLS recommended.

#### Service Account

It is a User account with keypair authentication and passwordless sudo permission.

- Create the app user

```sh
# create a <appuser>
sudo adduser <appuser>

# grant <appuser> sudo privileges
sudo usermod -aG sudo <appuser>

# grant <appuser> passwordless sudo
sudo visudo -f /etc/sudoers.d/appuser #(filename can't end in '~' or contain '.')

# add the line down below to conf and save
<appuser> ALL=(ALL) NOPASSWD:ALL

```

- Validate the app user

```sh
# login with new created app account and check the output of ls commands.
ls -la /root
sudo ls -la /root

(output the result without asking sudo password)

```

- Generate the auth key-pair for app account

```sh
# replace <appuser> with your username & keep the key file name
ssh-keygen -t ed25519 -C "<appuser>@localhost" -f ~/.ssh/id_rsa_stack
```

- Allow the server to accept the key authentication

```sh
ssh-copy-id <appuser>@localhost
```

#### Software Packages

- node 22+

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash

source ~/.bashrc

nvm list-remote

# pick any TLS version listed by above command
nvm install v22.19.0

node -v
```

- npm (options: yarn or pnpm)

```sh
# sudo apt install npm -y

npm install npm@latest -g

npm install --global yarn

npm install -g pnpm@latest-10
```

- pm2 (Process Manager, to run as prod service)

install with npm:

```sh
npm install pm2 -g
```

<!-- or install with yarn:

```sh
yarn global add pm2
``` -->

- sqlite3

(it would be pulled in automatically during the dependency installation. Please read the doc for separate installation.)

### Installation

1. Clone the repo

```sh
cd ~
git clone https://github.com/ai-micro-stack/micro-tent.git

# grant execute permission to bendend modules
sudo chmod +x -R ~/micro-tent/srv/modules
```

2. Setup backend api server

- Goto the app backend folder

```sh
# goto the backend dir
cd ~/micro-tent/srv
```

- Create api configurations from example template.

```sh
cp .env.example .env.development
cp .env.example .env.production
```

Modify the config contents to match your environment accordingly. Don't use the default http port 80, as we need it free for the pxe-boot service. Use the http reverse proxy to map it to port 80 or https 443 in production environment. (Same for frontend setup later!)

- Install dependency packages

instal dependencies with yarn (modest footprint, stable way)

```sh
yarn
```

or use pnpm to install (has smallest footprint)

```sh
pnpm install
```

or use npm to install (has largest footprint)

```sh
npm install
```

3. Initialize the database

- Goto the app backend folder

```sh
# goto the backend dir
cd ~/micro-tent/srv
```

- Run db utils using node

```sh
node ./utils/stack-metadata.js
node ./utils/stack-database.js
```

4. Setup frontend web app for micro-tent

- Goto the app front folder

```sh
# goto the frontend dir
cd ~/micro-tent/gui/tent
```

- Create the web ui configuration

Create app configurations from example template.

```sh
cp .env.example .env.development
cp .env.example .env.production
```

Modify the config contents as your environment accordingly

- Install Frontend Dependencies

use yarn to install (modest footprint, stable)

```sh
yarn
```

or use pnpm to install (smallest footprint)

```sh
pnpm install
```

or use npm to install (largest footprint)

```sh
npm install
```

- Build frontend dist (for production deployment only)

```sh
yarn run build
```

<!-- 5. Change git remote url to avoid accidental pushes to base project

```sh
git remote set-url origin github_username/repo_name
git remote -v # confirm the changes
``` -->

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Start Application

The application setup for either development and test environment are separately listed below.

1. Development environment

- Generate service acc key pair

```sh
ssh-keygen -t rsa -b 2048 -C "app-user@localhost"
```

- Handle sudo password request in script

```sh
sudo apt install sshpass curl -y
```

- Start the app backend

```sh
yarn run server
```

- Start frontend web ui

```sh
yarn run dev
```

- Use the app

<http://localhost:5173>

At first time using, app would popup an user registration page. Create an initial admin user. If the user register page does not popup for some reason, you run an util to create the initial user. The register util does not create new user if any user exists in the system.

```sh
node ./utils/stack-firstuser.js <user=name> <password>
```

2. Build the deployment package

It likes this of the folder structure of the deployment package

```
micro-tent
├─ srv (shared common backend)
│  └─ dist (backend code)
├─ gui
│  ├─ rack (rack frontend)
|  |  └─ dist (rack ui code)
|  └─ tent (tent frontend)
|     └─ dist (tent ui code)
└─ (others)
```

- Build the frontend dist

```sh
cd ~/micro-tent/gui/tent
yarn run lint # optionally to check the code syntax & ensoure the code is buildable
yarn run build
```

2. Optionally clear the test data

```sh
node ./utils/stack-database.js
```

3. Run the application

```sh
node server.js
```

or using pm2 to run it

```sh
pm2 start ecosystem.config.js
```

- Test the app by browing following url

<http://127.0.0.1:3002>

At first time using, app would popup an user registration page. Create an initial admin user at this this point. Other users can be created by this admin user. The initial admin user can be deleted once any other admin users are created.

_For more examples, please refer to the [Documentation](https://www.micro-stack.org)_

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->

## Roadmap

- [x] Add the Gluster as the option to support hyper convergence storage cluster
- [x] Add the Docker Swarm as the option to support the computing cluster
- [x] Add thh KeepAlived as the load balancer to support the high availability
- [x] Add the Portainer as the option for cluster monitor and management tool
- [x] Add the Ceph as the option tp support hyper convergence storage cluster
- [ ] Add the Kubernetes as the option to support the computing cluster
- [ ] Write the user guide document
- [ ] Multi-language Support
  - [ ] Chinese
  - [ ] Spanish

See the [open issues](https://github.com/ai-micro-stack/maintainer/micro-tent/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Top contributors

(will add soon ...)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

Principal Maintainer - [@Micro-Stack](https://www.micro-stack.org) - <maintainer@micro-stack.org>

Project Link: [https://github.com/ai-micro-stack](https://github.com/ai-micro-stack)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

Use this space to list resources you find helpful and would like to give credit to. I've included a few of my favorites to kick things off!

- [Choose an Open Source License](https://choosealicense.com)
- [GitHub Emoji Cheat Sheet](https://www.webpagefx.com/tools/emoji-cheat-sheet)
- [Malven's Flexbox Cheatsheet](https://flexbox.malven.co/)
- [Malven's Grid Cheatsheet](https://grid.malven.co/)
- [Img Shields](https://shields.io)
- [GitHub Pages](https://pages.github.com)
- [Font Awesome](https://fontawesome.com)
- [React Icons](https://react-icons.github.io/react-icons/search)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[Bash.sh]: https://img.shields.io/badge/gnu_bash-4EAA25.svg?&style=for-the-badge&logo=vite&logoColor=white
[Bash-url]: https://www.gnu.org/software/bash
[product-screenshot]: https://www.micro-stack.org/tent-2-home-page.png
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Bootstrap.com]: https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white
[Bootstrap-url]: https://getbootstrap.com
[Node.js]: https://img.shields.io/badge/node-5FA04E.svg?&style=for-the-badge&logo=node.js&logoColor=white
[Node-url]: https://nodejs.org/en
[Express.js]: https://img.shields.io/badge/express-000000.svg?&style=for-the-badge&logo=express&logoColor=white
[Express-url]: https://expressjs.com/
[Vite.js]: https://img.shields.io/badge/vite-646CFF.svg?&style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vite.dev/
[Xterm.js]: https://img.shields.io/badge/X-XTERM-blue?style=for-the-badge
[Xterm-url]: https://xtermjs.org/
