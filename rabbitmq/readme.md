docker run -d --hostname rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management


```
version: "3.8"
services:
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"


```