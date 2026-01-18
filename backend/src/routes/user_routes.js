import { Router } from 'express';

const router = Router();

router.post('/users', (req, res) => {
  // Lógica para criar um novo usuário
  res.status(201).send({ message: 'Usuário criado com sucesso!' });
});

router.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    // Lógica para obter informações do usuário pelo ID
    res.status(200).send({ id: userId, name: 'Nome do Usuário' });
});

router.put('/users/:id', (req, res) => {
    const userId = req.params.id;
    // Lógica para atualizar informações do usuário pelo ID
    res.status(200).send({ message: `Usuário ${userId} atualizado com sucesso!` });
});

router.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    // Lógica para deletar o usuário pelo ID
    res.status(200).send({ message: `Usuário ${userId} deletado com sucesso!` });
});