/* add these to /etc/sysctl.conf of name indicated type of nodes */

const masterArpConfAll = `
# No vIP binding on non-active nodes
net.ipv4.ip_nonlocal_bind=1
`;

const backupArpConfAll = `
# No vIP binding on non-active nodes
net.ipv4.ip_nonlocal_bind=1
`;

const workArpConfAll = `
# No vIP binding on non-active nodes
net.ipv4.ip_nonlocal_bind=1

# solve ARP flux problem on all NICs
net.ipv4.conf.lo.arp_ignore = 1
net.ipv4.conf.lo.arp_announce = 2
net.ipv4.conf.dummy0.arp_ignore = 1
net.ipv4.conf.dummy0.arp_announce = 2
net.ipv4.conf.all.arp_ignore = 1
net.ipv4.conf.all.arp_announce = 2
net.ipv4.conf.enp6s18.arp_ignore = 1
net.ipv4.conf.enp5s18.arp_announce = 2
`;
