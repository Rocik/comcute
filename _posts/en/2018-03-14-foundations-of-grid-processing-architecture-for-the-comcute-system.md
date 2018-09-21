---
layout: post
lang: en
title: "Foundations of Grid Processing Architecture for the Comcute System"
date: 2018-03-14 20:00:00 +0100
categories: comcute
authors: [ PiotrBrudlo ]
---

In the chapter, fundamental system algorithms and structures implemented in the Comcute system are described and analysed in detail. Layered architecture of the system model is highlighted. System tasks of the layers are elaborated, presented and described. Operational details of communication interfaces among layers are worked out and examined. The focus is put onto implemented system components with regard to their operability and efficiency. Scalability and system openness, as the key design factors of the implementation, are deliberatively taken into account. Important aspects of operability are addressed and the issues of validation, verification and deployment of the adopted system solutions are discussed. Practical application aspects of the Comcute system are described with respect to its final implementation and target installation in the form of grid processing in the open worldwide Internet.

# 1.1.  Design issues

Several design versions of the Comcute system have been elaborated and successfully implemented. At the present stage, the system has been tested, verified and validated in its all fundamental functionalities. Scalability tests have been carried out within required application scope. In practical experiments, the Comcute has processed both system layered tasks and application computations according to design requirements. As applications, several instances have been run: breaking of DES codes with specified lengths, generation of great prime numbers of defined properties and research on text file similarities in compression processes. The obtained results of the experiments have allowed elaboration of general conclusions and experiences for deployment of the Comcute system in the form of grid computing into the Internet. The two processing paradigms have been considered: volunteer computing as well as obligatory computing \[1\], \[2\].

# 1.2.  System architecture

The layered architecture has been elaborated for the Comcute system \[3\]. Layer _W_ is responsible for task and data distribution, as well as for delivery of execution modules and data packages for processing. Layer _S_ organises the processing, in layer _I_ the processing is being generically carried out. Passing of results starts at layer _I_ and goes up to layer _W_ through layer _S_. This has been presented in conceptual scheme in Fig. 3.1. Moreover, above the layer _W_, there has been introduced high-level layer _Z_. Layer _Z_ is to provide and serve as an entry interface to the Comcute system for clients who define and launch their applications.

{% include figure.html file="/images/image1.png" alt="General conceptual scheme for the Comcute system" caption="Fig. 3.1. General conceptual scheme for the Comcute system" %}

The conceptual scheme (Fig. 3.1) illustrates operational implementation of layer _S_ in cooperation with layers _W_ and _I_ in the process of execution of required computational sub-tasks. The sub-tasks are components of high-level applications delivered form layer _Z_. In practice, layer _S_ receives complete program modules with attached data packages. Next, both program modules and data packages are being sent down to layer _I_ \[4\].

## 1.2.1.  Inter-layer cooperation

The conceptual scheme (Fig. 3.1) has been developed and elaborated with respect to realisation details. In Fig. 3.2, system architecture and complete operational flowchart are presented. Practical processing aspects have been deliberatively spotlighted. The architecture concentrates around four main conceptual components. They are: server _W_, servers _S_, Load Balancer and global user area (Internet), respectively.

{% include figure.html file="/images/image2.png" alt="Design of operational diagram of the Comcute system" caption="Fig. 3.2. Design of operational diagram of the Comcute system" %}

Server _W_ monitors operational activities and controls task execution at the higher layer. It distributes task modules to relevant servers _S_, and next, collects and combines the obtained results. Server _W_ is the entry point for an application client. Servers _S_ disseminate task modules to Internet users, control their executions and distribute data packages. Servers _S_ verify correctness of the results obtained form Internet users. Consecutive component: Load Balancer connects Internet users to servers _S_ having small temporary processing workload. In case an Internet user comes to the Comcute system, server _S_ gets its own copy of a task module with relevant data packages.

According to the chart presented in Fig. 3.2, one may enumerate consecutive operational steps:

1. servers _S_ are registered at server _W_
2. server _W_ distributes task modules and data packages
3. server _W_ determines task allocations according to Load Balancer data
4. Internet user opens a web page
5. Internet user selects the link of Load Balancer
6. Load Balancer attaches the Internet user to a selected server _S_
7. web browser of the Internet user gets its task
8. the task connects to the Load Balancer in order to get connection to server _S_
9. the task gets its data package for processing
10. results are sent back from the Internet user to server _S_ and to server _W_.

The proposed solution is sensible and clear, and has allowed achievement of specified operability and effectiveness. One may notice that the operational diagram incorporates key features of scalability and system transparency.

### 1.2.2. Applications

The Comcute system has been successfully implemented, tested and validated. In its current version, one may compute one’s own processing tasks. As applications, several instances have been run: breaking of DES codes with specified lengths, generation of great prime numbers of defined properties and determination of text file similarities in compression processes.

### 1.2.3. Data packages distribution for tasks

Task distribution in the Comcute system is not limited by the system itself, and is merely defined by types (classes) of computation applications and their own inherent characteristics. A Comcute user should only deliver task code modules with relevant data packages and may control the distribution processes. The Comcute system does not confine the range of processing models, and allows running of almost any of currently used distributed network processing paradigms, e.g. cloud or grid computing.

{% include figure.html file="/images/image3.png" alt="Flowchart of task distribution model for the Comcute system" caption="Fig. 3.3. Flowchart of task distribution model for the Comcute system" %}

In the current version of the Comcute system, the two models of data distributions have been carefully tested and verified. In applications of great prime numbers generation and breaking DES codes, data packages are not correlated with one another, and so consecutive sub-executions can be processed separately and independently. Every data package can be practically processed by any random Internet user. Data distribution, is this case, is significantly simpler. Data is packaged into portions, and each package is assigned its unique identifier. The identifier is used in result collection processes, after completion of the tasks’ executions. In case of text file content similarity determination, partial results have to be used in consecutive processing, and they should be stored temporarily in servers _S_. In general, in many cases, the data is connected inherently, which results in necessity of inner communication. The issue can be solved by use of functionalities of Distributor component in layer _S_ (Fig. 3.3). In layer _S_, communication among servers is not considered, and there is no possibility of data exchange within the layer. Internet users should get relevant data packages, so correlated data should be placed onto the same server _S_. In server _W_, Data Generator distributes relevant data packages to selected servers _S_, solving the issues according to adopted optimisation procedures \[5\], \[6\].

# 1.3. Implementation specifications

In the implementation of the Comcute system, several classes of functionalities have been realised. Among others, one may enumerate the operational functionalities and software components like: user interface, inter-node communicator, layer _S_ interface, workload monitor, task status monitor, task execution controller, repository for tasks, task distributor, results collector, repository of results, and many others. They are characterised below:

#### User interface

* reception of high-level applications for execution,
* controlling of tasks execution status,
* sending results to a user.

#### Inter-node communicator

* general communication with servers of layer _W,_
* communication with subsets of servers in layer _W,_
* sending messages to selected server sub-groups,
* reception of messages form selected servers of layer _W_.

#### Layer _S_ interface

* reception of messages form selected servers of layer _S,_
* data sending to selected servers _S_,
* reception of results from servers of layer _S._

#### Workload monitor

* determination of inner workload of a computing nodes,
* global determination of workload of servers in layers _W_ and _S_,
* generation of ordered list of workloads of servers in a layer.

#### Task status monitor

* status control of tasks being in execution,
* reporting of task execution statuses.

#### Task execution controller

* task partitioning into execution module,
* distribution of modules with task codes,
* reception and analysis of partial results,
* verification of results of task execution,
* verification of task termination conditions,
* consolidation of partial results into complete ones.

#### Repository for tasks

* storing and delivering of execution codes for tasks,
* delivering and storing of data packages for tasks,
* collecting and storing partial results of tasks.

#### Task distributor

* deploying of tasks on servers in layer _S_,
* distribution of data packages for processing,
* reception of results form execution servers in layer _S_.

#### Results collector

* starting of execution code for results consolidation,
* storing of results in results repository.

#### Repository of results

* storing of complete final results,
* results presentation for Comcute users,
* verification of execution of the processed tasks.

In general, the specified functionalities and software components have been successfully tested and verified. The construction of the functionalities satisfies the system transparency and interoperability requirements and the software can be adapted to paradigms of grid or cloud computing in the Internet.

# 1.4. Conclusions

Architectural and conceptual foundations of the Comcute system have been elaborated and described. The Comcute system has been implemented, verified and validated. Several practical applications have been processed by the system. The results obtained for applications: DES codes breaking, great prime numbers generation and text file similarity determination by compression, have confirmed and proven the applicability of the global concept for practical realisation. At present, the system can be deployed in the Internet and can benefit from practically unlimited processing powers of personal computers in the global network for many various types of applications \[7\]. In general, one can notice that the structure and conceptual solutions of the Comcute system prefer massive processing of great number of small independent tasks, executed according to single instruction multiple data (SIMD) processing paradigm. However, also other types (classes) of distributed network processing, like grid or cloud computing, can be supported and realised in practice within acceptable desired level of efficiency and computing optimality.

# References

1. Brudło P.: _Berkeley Open Infrastructure for Network Computing_, Chapter in monograph: „Distributed Calculations in Computer Systems of Grid Class Architecture”, Publisher: Gdansk University of Technology, Faculty of Electronics, Telecommunications and Informatics, Gdańsk, Poland, 2012, pp. 39-45.
2. Balicki J., Brudło P., Czarnul P., Kuchta J., Matuszek M., Szpryngier P., Szymański J.: _Functional Design of the Comcute System_, R&D technical report 33/2011, Gdansk University of Technology, Faculty of Electronics, Telecommunications and Informatics, Gdansk, Poland, 2011.
3. Brudło P.: _Implementation Issues in the Comcute System_, Chapter in monograph: „Distributed Calculations in Computer Systems of Grid Class Architecture”, Publisher: Gdansk University of Technology, Faculty of Electronics, Telecommunications and Informatics, Gdańsk, Poland, 2012, pp. 127-136.
4. Brudło P., Kuchta J., Szpryngier P., Szymański J.: _Requirements for Implementation of Selected Computational Methods for the Comcute System_, R&D technical report 36/2011, Gdansk University of Technology, Faculty of Electronics, Telecommunications and Informatics, Gdansk, Poland, 2011.
5. Brudło P., Czarnul P., Kuchta J., Szpryngier P., Szymański J.: _Characteristics of Distributed Computations for the Comcute System,_ R&D technical report 41/2011, Gdansk University of Technology, Faculty of Electronics, Telecommunications and Informatics, Gdansk, Poland, 2011.
6. Balicki J., Bieliński T., Brudło P., Paluszak J., Szymański J: _Dissemination of Computations with Distribution Servers_, Chapter in monograph: „Distributed Calculations in Computer Systems of Grid Class Architecture”, Publisher: Gdansk University of Technology, Faculty of Electronics, Telecommunications and Informatics, Gdańsk, Poland, 2012, pp. 113-126.
7. Brudło P.: _Security in Monitoring_, Chapter in monograph: „Distributed Calculations in Computer Systems of Grid Class Architecture”, Publisher: Gdansk University of Technology, Faculty of Electronics, Telecommunications and Informatics, Gdańsk, Poland, 2012, pp. 175-184.
