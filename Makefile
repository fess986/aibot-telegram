build:
	docker build -t aibot  .

run:
	docker run -d -p 3000:3000 --name aibot --rm aibot