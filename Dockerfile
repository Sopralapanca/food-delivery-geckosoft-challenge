FROM ubuntu:latest
LABEL authors="giaco"

ENTRYPOINT ["top", "-b"]