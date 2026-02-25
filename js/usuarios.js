$(document).ready(function() {
    if (!Auth.requireAuth()) return;
    
    const path = window.location.pathname.split('/').pop();
    
    if (path === 'usuarios.html') {
        if (!Auth.isAdmin()) {
            window.location.href = 'dashboard.html';
            return;
        }
        carregarUsuarios();
    } else if (path === 'usuarios-excluidos.html') {
        if (!Auth.isAdmin()) {
            window.location.href = 'dashboard.html';
            return;
        }
        carregarUsuariosExcluidos();
    } else if (path === 'confirmar-exclusao.html') {
        if (!Auth.isAdmin()) {
            window.location.href = 'dashboard.html';
            return;
        }
        initConfirmarExclusao();
    }
});

function carregarUsuarios() {
    const usuarios = DB.getUsuariosAtivos();
    const currentUser = Auth.getCurrentUser();
    
    if (usuarios.length === 0) {
        $('#tabela-usuarios').html('<tr><td colspan="9" class="text-center">Nenhum usuário encontrado.</td></tr>');
        return;
    }
    
    let html = '';
    usuarios.forEach(usuario => {
        const tipoClass = usuario.is_admin ? 'bg-primary' : (usuario.is_tecnico ? 'bg-info' : 'bg-secondary');
        const tipoText = usuario.is_admin ? 'Administrador' : (usuario.is_tecnico ? 'Técnico' : 'Usuário');
        
        html += `
            <tr>
                <td>${usuario.id}</td>
                <td>${usuario.nome}</td>
                <td>${usuario.email}</td>
                <td><span class="badge ${tipoClass}">${tipoText}</span></td>
                <td><span class="badge bg-success">Ativo</span></td>
                <td>${new Date(usuario.data_cadastro).toLocaleDateString('pt-BR')}</td>
                <td>${usuario.ultimo_acesso ? new Date(usuario.ultimo_acesso).toLocaleString('pt-BR') : 'Nunca'}</td>
                <td>
                    ${usuario.id !== currentUser.id ? `
                        <button class="btn btn-sm btn-danger" onclick="toggleStatus(${usuario.id}, '${usuario.nome}', ${usuario.ativo})">
                            <i class="bi bi-person-x"></i> Desativar
                        </button>
                    ` : '<span class="text-muted">Usuário atual</span>'}
                </td>
                <td>
                    ${usuario.id !== currentUser.id ? `
                        <a href="confirmar-exclusao.html?id=${usuario.id}" class="btn btn-sm btn-danger">
                            <i class="bi bi-trash"></i>
                        </a>
                    ` : '-'}
                </td>
            </tr>
        `;
    });
    
    $('#tabela-usuarios').html(html);
}

function carregarUsuariosExcluidos() {
    const usuarios = DB.getUsuariosInativos();
    
    if (usuarios.length === 0) {
        $('#tabela-usuarios-excluidos').html('<tr><td colspan="7" class="text-center">Nenhum usuário excluído encontrado.</td></tr>');
        return;
    }
    
    let html = '';
    usuarios.forEach(usuario => {
        const tipoClass = usuario.is_admin ? 'bg-primary' : (usuario.is_tecnico ? 'bg-info' : 'bg-secondary');
        const tipoText = usuario.is_admin ? 'Admin' : (usuario.is_tecnico ? 'Técnico' : 'Usuário');
        const excluidor = usuario.excluido_por ? DB.getUsuarioById(usuario.excluido_por) : null;
        
        html += `
            <tr class="table-danger">
                <td>${usuario.id}</td>
                <td>${usuario.nome}</td>
                <td><small>${usuario.email.substring(0, 30)}...</small></td>
                <td><span class="badge ${tipoClass}">${tipoText}</span></td>
                <td>${usuario.data_exclusao ? new Date(usuario.data_exclusao).toLocaleString('pt-BR') : 'N/A'}</td>
                <td>${excluidor ? excluidor.nome : 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="restaurarUsuario(${usuario.id})">
                        <i class="bi bi-arrow-counterclockwise"></i> Restaurar
                    </button>
                </td>
            </tr>
        `;
    });
    
    $('#tabela-usuarios-excluidos').html(html);
}

function toggleStatus(id, nome, ativo) {
    const acao = ativo ? 'desativar' : 'ativar';
    if (confirm(`Tem certeza que deseja ${acao} o usuário ${nome}?`)) {
        const user = Auth.getCurrentUser();
        const usuario = DB.getUsuarioById(id);
        usuario.ativo = !usuario.ativo;
        DB.updateUsuario(id, { ativo: usuario.ativo });
        alert(`Usuário ${acao}do com sucesso!`);
        location.reload();
    }
}

function restaurarUsuario(id) {
    if (confirm('Deseja restaurar este usuário?')) {
        DB.restaurarUsuario(id);
        alert('Usuário restaurado com sucesso!');
        location.reload();
    }
}

function criarUsuario() {
    const nome = $('#novo_nome').val();
    const email = $('#novo_email').val();
    const senha = $('#novo_senha').val();
    const isTecnico = $('#novo_tecnico').is(':checked');
    const isAdmin = $('#novo_admin').is(':checked');
    
    if (!nome || !email || !senha) {
        alert('Preencha todos os campos!');
        return;
    }
    
    if (senha.length < 6) {
        alert('A senha deve ter no mínimo 6 caracteres!');
        return;
    }
    
    if (DB.getUsuarioByEmail(email)) {
        alert('Este email já está cadastrado!');
        return;
    }
    
    const novoUsuario = {
        nome: nome,
        email: email,
        senha: DB.hashSenha(senha),
        is_admin: isAdmin,
        is_tecnico: isTecnico,
        ativo: true
    };
    
    DB.addUsuario(novoUsuario);
    $('#novoUsuarioModal').modal('hide');
    $('#formNovoUsuario')[0].reset();
    alert('Usuário criado com sucesso!');
    location.reload();
}

function initConfirmarExclusao() {
    const urlParams = new URLSearchParams(window.location.search);
    const usuarioId = parseInt(urlParams.get('id'));
    
    if (!usuarioId) {
        window.location.href = 'usuarios.html';
        return;
    }
    
    const usuario = DB.getUsuarioById(usuarioId);
    const chamadosCriados = DB.getChamados().filter(c => c.usuario_id === usuarioId).length;
    const chamadosTecnicos = DB.getChamados().filter(c => c.tecnico_id === usuarioId).length;
    
    let html = `
        <h5>Dados do Usuário:</h5>
        <table class="table">
            <tr><th>ID:</th><td>${usuario.id}</td></tr>
            <tr><th>Nome:</th><td>${usuario.nome}</td></tr>
            <tr><th>Email:</th><td>${usuario.email}</td></tr>
            <tr><th>Tipo:</th><td>${usuario.is_admin ? 'Administrador' : (usuario.is_tecnico ? 'Técnico' : 'Usuário')}</td></tr>
            <tr><th>Data Cadastro:</th><td>${new Date(usuario.data_cadastro).toLocaleDateString('pt-BR')}</td></tr>
        </table>
        
        <div class="alert alert-info">
            <h6>Chamados associados:</h6>
            <ul>
                <li>Chamados criados: <strong>${chamadosCriados}</strong></li>
                <li>Chamados como técnico: <strong>${chamadosTecnicos}</strong></li>
            </ul>
        </div>
    `;
    
    $('#dados-usuario').html(html);
    
    if (chamadosCriados === 0 && chamadosTecnicos === 0) {
        $('#opcao-permanente').html(`
            <div class="card mb-3">
                <div class="card-header bg-danger text-white">
                    <h6>Exclusão Permanente</h6>
                </div>
                <div class="card-body">
                    <p>Remove completamente o usuário do banco de dados.</p>
                    <p class="text-danger"><strong>Esta ação não pode ser desfeita!</strong></p>
                    <button class="btn btn-danger w-100" onclick="excluirPermanente(${usuario.id})">
                        <i class="bi bi-trash"></i> Excluir Permanentemente
                    </button>
                </div>
            </div>
        `);
    }
    
    window.usuarioId = usuarioId;
}

function softDelete() {
    if (confirm('Deseja desativar este usuário? O histórico será mantido.')) {
        DB.softDeleteUsuario(window.usuarioId, Auth.getCurrentUser().id);
        alert('Usuário desativado com sucesso!');
        window.location.href = 'usuarios.html';
    }
}

function excluirPermanente(id) {
    if (confirm('TEM CERTEZA que deseja EXCLUIR PERMANENTEMENTE este usuário?\n\nEsta ação NÃO PODE SER DESFEITA!')) {
        DB.deleteUsuario(id);
        alert('Usuário excluído permanentemente!');
        window.location.href = 'usuarios.html';
    }
}