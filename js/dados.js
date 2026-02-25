// Simulação do banco de dados usando localStorage
const DB = {
    init: function() {
        if (!localStorage.getItem('usuarios')) {
            const usuarios = [
                {
                    id: 1,
                    nome: 'Administrador',
                    email: 'admin@empresa.com',
                    senha: this.hashSenha('admin123'),
                    is_admin: true,
                    is_tecnico: false,
                    data_cadastro: new Date().toISOString(),
                    ultimo_acesso: null,
                    ativo: true
                },
                {
                    id: 2,
                    nome: 'João Técnico',
                    email: 'joao@empresa.com',
                    senha: this.hashSenha('tecnico123'),
                    is_admin: false,
                    is_tecnico: true,
                    data_cadastro: new Date().toISOString(),
                    ultimo_acesso: null,
                    ativo: true
                },
                {
                    id: 3,
                    nome: 'Maria Usuário',
                    email: 'maria@email.com',
                    senha: this.hashSenha('usuario123'),
                    is_admin: false,
                    is_tecnico: false,
                    data_cadastro: new Date().toISOString(),
                    ultimo_acesso: null,
                    ativo: true
                }
            ];
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
        }
        
        if (!localStorage.getItem('chamados')) {
            const chamados = [
                {
                    id: 1,
                    titulo: 'Computador não liga',
                    descricao: 'O computador do setor financeiro não está ligando',
                    status: 'aberto',
                    prioridade: 'alta',
                    data_criacao: new Date().toISOString(),
                    data_atualizacao: new Date().toISOString(),
                    usuario_id: 3,
                    tecnico_id: null,
                    localizacao: 'Setor Financeiro',
                    equipamento: 'Computador Dell'
                },
                {
                    id: 2,
                    titulo: 'Impressora com problema',
                    descricao: 'Impressora está travando ao imprimir',
                    status: 'em_andamento',
                    prioridade: 'media',
                    data_criacao: new Date(Date.now() - 86400000).toISOString(),
                    data_atualizacao: new Date().toISOString(),
                    usuario_id: 3,
                    tecnico_id: 2,
                    localizacao: 'Recepção',
                    equipamento: 'Impressora HP'
                }
            ];
            localStorage.setItem('chamados', JSON.stringify(chamados));
        }
        
        if (!localStorage.getItem('historico')) {
            const historico = [
                {
                    id: 1,
                    chamado_id: 1,
                    usuario_id: 3,
                    acao: 'criacao',
                    descricao: 'Chamado criado',
                    data_acao: new Date().toISOString()
                },
                {
                    id: 2,
                    chamado_id: 2,
                    usuario_id: 3,
                    acao: 'criacao',
                    descricao: 'Chamado criado',
                    data_acao: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: 3,
                    chamado_id: 2,
                    usuario_id: 1,
                    acao: 'atualizacao',
                    descricao: 'Chamado atribuído a João Técnico',
                    data_acao: new Date(Date.now() - 43200000).toISOString()
                }
            ];
            localStorage.setItem('historico', JSON.stringify(historico));
        }
        
        if (!localStorage.getItem('proximoId')) {
            localStorage.setItem('proximoId', JSON.stringify({
                usuario: 4,
                chamado: 3,
                historico: 4
            }));
        }
    },
    
    hashSenha: function(senha) {
        return btoa(senha);
    },
    
    getUsuarios: function() {
        return JSON.parse(localStorage.getItem('usuarios')) || [];
    },
    
    getUsuariosAtivos: function() {
        return this.getUsuarios().filter(u => u.ativo);
    },
    
    getUsuariosInativos: function() {
        return this.getUsuarios().filter(u => !u.ativo);
    },
    
    getUsuarioById: function(id) {
        return this.getUsuarios().find(u => u.id === id);
    },
    
    getUsuarioByEmail: function(email) {
        return this.getUsuarios().find(u => u.email === email);
    },
    
    addUsuario: function(usuario) {
        const usuarios = this.getUsuarios();
        const proximoId = JSON.parse(localStorage.getItem('proximoId'));
        usuario.id = proximoId.usuario++;
        usuario.data_cadastro = new Date().toISOString();
        usuario.ativo = true;
        usuarios.push(usuario);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        localStorage.setItem('proximoId', JSON.stringify(proximoId));
        return usuario;
    },
    
    updateUsuario: function(id, novosDados) {
        const usuarios = this.getUsuarios();
        const index = usuarios.findIndex(u => u.id === id);
        if (index !== -1) {
            usuarios[index] = { ...usuarios[index], ...novosDados };
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
            return true;
        }
        return false;
    },
    
    deleteUsuario: function(id) {
        const usuarios = this.getUsuarios();
        const novosUsuarios = usuarios.filter(u => u.id !== id);
        localStorage.setItem('usuarios', JSON.stringify(novosUsuarios));
    },
    
    softDeleteUsuario: function(id, excluidorId) {
        const usuarios = this.getUsuarios();
        const index = usuarios.findIndex(u => u.id === id);
        if (index !== -1) {
            usuarios[index].ativo = false;
            usuarios[index].data_exclusao = new Date().toISOString();
            usuarios[index].excluido_por = excluidorId;
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
            return true;
        }
        return false;
    },
    
    restaurarUsuario: function(id) {
        const usuarios = this.getUsuarios();
        const index = usuarios.findIndex(u => u.id === id);
        if (index !== -1) {
            usuarios[index].ativo = true;
            usuarios[index].data_exclusao = null;
            usuarios[index].excluido_por = null;
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
            return true;
        }
        return false;
    },
    
    getChamados: function() {
        return JSON.parse(localStorage.getItem('chamados')) || [];
    },
    
    getChamadoById: function(id) {
        return this.getChamados().find(c => c.id === id);
    },
    
    getChamadosByUsuario: function(usuarioId) {
        return this.getChamados().filter(c => c.usuario_id === usuarioId);
    },
    
    addChamado: function(chamado) {
        const chamados = this.getChamados();
        const proximoId = JSON.parse(localStorage.getItem('proximoId'));
        chamado.id = proximoId.chamado++;
        chamado.data_criacao = new Date().toISOString();
        chamado.data_atualizacao = chamado.data_criacao;
        chamados.push(chamado);
        localStorage.setItem('chamados', JSON.stringify(chamados));
        localStorage.setItem('proximoId', JSON.stringify(proximoId));
        
        this.addHistorico({
            chamado_id: chamado.id,
            usuario_id: chamado.usuario_id,
            acao: 'criacao',
            descricao: 'Chamado criado'
        });
        
        return chamado;
    },
    
    updateChamado: function(id, novosDados) {
        const chamados = this.getChamados();
        const index = chamados.findIndex(c => c.id === id);
        if (index !== -1) {
            chamados[index] = { ...chamados[index], ...novosDados, data_atualizacao: new Date().toISOString() };
            localStorage.setItem('chamados', JSON.stringify(chamados));
            return true;
        }
        return false;
    },
    
    getHistorico: function() {
        return JSON.parse(localStorage.getItem('historico')) || [];
    },
    
    getHistoricoByChamado: function(chamadoId) {
        return this.getHistorico().filter(h => h.chamado_id === chamadoId).sort((a, b) => 
            new Date(b.data_acao) - new Date(a.data_acao)
        );
    },
    
    addHistorico: function(historico) {
        const historicos = this.getHistorico();
        const proximoId = JSON.parse(localStorage.getItem('proximoId'));
        historico.id = proximoId.historico++;
        historico.data_acao = new Date().toISOString();
        historicos.push(historico);
        localStorage.setItem('historico', JSON.stringify(historicos));
        localStorage.setItem('proximoId', JSON.stringify(proximoId));
        return historico;
    }
};

DB.init();