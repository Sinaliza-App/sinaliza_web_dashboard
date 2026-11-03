# ==========================================
# Dockerfile: Dashboard Web (React + Vite)
# ==========================================
FROM node:20-alpine

WORKDIR /app

# Copia arquivos de definição de dependências
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o código-fonte da aplicação
COPY . .

# Expõe a porta do Vite
EXPOSE 5173

# Executa o Vite aceitando conexões de fora do container (--host 0.0.0.0)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
