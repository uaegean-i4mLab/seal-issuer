# SEAL-VC-ISSUER

---

The "SEAL-VC-ISSUER" is a Verifiable Credential (VC) Issuer developed during the course of the [SEAL project](https://project-seal.eu/about).
It enables students to combine their eIDAS eIDs with their Academic Profiles fetched through EduGAIN to issue VCs that enable them to gain access to selected services offered by the Higher Education 
Institutions (HEIs) that are partnered with the Project. 

 

# Code

---

*Disclaimer: Although we tested the code extensively, the "SEAL-VC-ISSUER" is a research
prototype that may contain bugs. We take no responsibility for and give no warranties in respect of using the code.*

## Layout

The "SEAL-VC-ISSUER" microservice is implemented
via a Spring boot application.  As a result it adheres to the typical Spring boot structure:
- `src/main` contains the main logic of the application
- `src/test` contains the executed unit tests


# Deployment

---
The "SEAL-VC-ISSUER" microservice is implemented via Spring Boot and is Dockerized in order to
facilitate its deployment, a typical Docker-compose file for its deployment would look as follows:
```
 
version: '2'
services:
  uportissuer:
  image: endimion13/seal-issuer:0.0.3d
  environment:
    NODE_ENV: "production"
    ENDPOINT: https://dss1.aegean.gr
    HTTPS_COOKIES: "true"
    BASE_PATH: "issuer"
    SENDER_ID: "IdPms001"
    RECEIVER_ID: "IdPms001"
    MEMCACHED_URL: memcached:11211
  ports:
    - 4000:3000

memcached:
  image: sameersbn/memcached:1.5.6-2
  ports:
    - 11112:11211    
```
 

# Further Reading and Documentation

---
If you want to learn more about the "SEAL-VC-ISSUER" please read the material available at the official project [web page](https://project-seal.eu/)

# Code

---

*Disclaimer: Although we tested the code extensively, the "PALAEMON-DB-PROXY" is a research
prototype that may contain bugs. We take no responsibility for and give no warranties in respect of using the code.*


