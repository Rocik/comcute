---
layout: post
lang: en
title: "Data Partitioning and Task Management in the Clustered Server Layer of the Volunteer-based Computation System"
date: 2018-03-14 20:00:00 +0100
categories: comcute
authors: [ JaroslawKuchta ]
pdfFile: "data_partitioning_and_task_management"
---

While the typical volunteer-based distributed computing system [1] focus on the computing performance, the Comcute system [3] was designed especially to keep alive in the emergency situations. This means that designers had to take into account not only performance, but the safety of calculations as well. Quadruple-layered architecture was proposed to separate the untrusted components from the core of the system. The main layer (W) consists of independent server nodes, which are coupled into a cluster. The W-servers provide task promotion among the nodes, data partitioning, results gathering, comparing and merging. The cluster remains operational as long as one of the nodes is able to operate. This paper describes the functionality of the Comcute system from the W-node perspective considering two task parameters: required performance level and required level of computational reliability.