const Auth = {
    currentUser: null,
    
    login: function(email, senha) {
        const usuario = DB.getUsuarioByEmail(email);
        if (usuario && usuario.ativo && DB.hashSenha(senha) === usuario.senha) {
            usuario.ultimo_acesso = new Date().toISOString();
            DB.updateUsuario(usuario.id, { ultimo_acesso: usuario.ultimo_acesso });
            
            sessionStorage.setItem('currentUser', JSON.stringify(usuario));
            this.currentUser = usuario;
            return { success: true, usuario };
        }
        return { success: false, mensagem: 'Email ou senha inválidos' };
    },
    
    logout: function() {
        sessionStorage.removeItem('currentUser');
        this.currentUser = null;
        window.location.href = 'login.html';
    },
    
    checkAuth: function() {
        const userJson = sessionStorage.getItem('currentUser');
        if (userJson) {
            this.currentUser = JSON.parse(userJson);
            return true;
        }
        return false;
    },
    
    requireAuth: function() {
        if (!this.checkAuth()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },
    
    isAdmin: function() {
        return this.currentUser && this.currentUser.is_admin;
    },
    
    isTecnico: function() {
        return this.currentUser && this.currentUser.is_tecnico;
    },
    
    getCurrentUser: function() {
        return this.currentUser;
    },
    
    updateCurrentUser: function(novosDados) {
        if (this.currentUser) {
            this.currentUser = { ...this.currentUser, ...novosDados };
            sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            DB.updateUsuario(this.currentUser.id, novosDados);
        }
    }
};

$(document).ready(function() {
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        const email = $('#email').val();
        const senha = $('#senha').val();
        
        const result = Auth.login(email, senha);
        if (result.success) {
            window.location.href = 'dashboard.html';
        } else {
            alert(result.mensagem);
        }
    });
    
    $('#cadastroForm').on('submit', function(e) {
        e.preventDefault();
        const nome = $('#nome').val();
        const email = $('#email').val();
        const senha = $('#senha').val();
        
        if (DB.getUsuarioByEmail(email)) {
            alert('Este email já está cadastrado!');
            return;
        }
        
        const novoUsuario = {
            nome: nome,
            email: email,
            senha: DB.hashSenha(senha),
            is_admin: false,
            is_tecnico: false,
            ativo: true
        };
        
        DB.addUsuario(novoUsuario);
        alert('Cadastro realizado com sucesso! Faça login.');
        window.location.href = 'login.html';
    });
    
    $('#logoutBtn').on('click', function(e) {
        e.preventDefault();
        Auth.logout();
    });
    
    $('#email').on('blur', function() {
        const email = $(this).val();
        if (email.length > 5) {
            const usuario = DB.getUsuarioByEmail(email);
            if (usuario) {
                $('#email-feedback').html('<span class="text-danger"><i class="bi bi-exclamation-circle"></i> Email já cadastrado</span>');
            } else {
                $('#email-feedback').html('<span class="text-success"><i class="bi bi-check-circle"></i> Email disponível</span>');
            }
        }
    });
    
    $('#confirmar_senha').on('keyup', function() {
        const senha = $('#senha').val();
        const confirmar = $(this).val();
        
        if (confirmar.length > 0) {
            if (senha === confirmar) {
                $('#senha-feedback').html('<span class="text-success"><i class="bi bi-check-circle"></i> Senhas conferem</span>');
            } else {
                $('#senha-feedback').html('<span class="text-danger"><i class="bi bi-exclamation-circle"></i> Senhas não conferem</span>');
            }
        } else {
            $('#senha-feedback').html('');
        }
    });
});